from aws_cdk import (
    Stack,
    aws_s3 as s3,
    aws_cloudfront as cloudfront,
    aws_secretsmanager as secretsmanager,
    aws_iam as iam,
    aws_lambda as lambda_,
    aws_apigateway as apigateway,
    CfnOutput,
    RemovalPolicy,
    Duration,
)
from constructs import Construct

class CdkStack(Stack):

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Parameters
        s3_bucket_name = "activity-database-chatbot"
        openai_api_key_secret_name = "openai-api-key"

        # S3 Bucket
        activity_bucket = s3.Bucket(
            self, "ActivityBucket",
            bucket_name=s3_bucket_name,
            website_index_document="index.html",
            website_error_document="error.html",
            removal_policy=RemovalPolicy.DESTROY,
            cors=[
                s3.CorsRule(
                    allowed_methods=[s3.HttpMethods.GET],
                    allowed_origins=["*"],
                    allowed_headers=["*"],
                    max_age=3000
                )
            ],
            block_public_access=s3.BlockPublicAccess.BLOCK_ACLS,
            access_control=s3.BucketAccessControl.PRIVATE
        )

        # S3 Bucket Policy
        activity_bucket.add_to_resource_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                principals=[iam.AnyPrincipal()],
                actions=["s3:GetObject"],
                resources=[activity_bucket.arn_for_objects("*")]
            )
        )

        # CloudFront Distribution
        cloudfront_distribution = cloudfront.CloudFrontWebDistribution(
            self, "CloudFrontDistribution",
            origin_configs=[
                cloudfront.SourceConfiguration(
                    custom_origin_source=cloudfront.CustomOriginConfig(
                        domain_name=activity_bucket.bucket_website_domain_name,
                        origin_protocol_policy=cloudfront.OriginProtocolPolicy.HTTP_ONLY,
                        http_port=80,
                        https_port=443
                    ),
                    behaviors=[
                        cloudfront.Behavior(
                            is_default_behavior=True,
                            viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                            allowed_methods=cloudfront.CloudFrontAllowedMethods.GET_HEAD,
                            cached_methods=cloudfront.CloudFrontAllowedCachedMethods.GET_HEAD,
                            forwarded_values=cloudfront.CfnDistribution.ForwardedValuesProperty(
                                query_string=False,
                                cookies=cloudfront.CfnDistribution.CookiesProperty(
                                    forward="none"
                                )
                            )
                        )
                    ]
                )
            ],
            price_class=cloudfront.PriceClass.PRICE_CLASS_100,
            default_root_object="index.html"
        )

        # Secrets Manager for OpenAI API Key
        openai_api_key_secret = secretsmanager.Secret(
            self, "OpenAIAPIKeySecret",
            secret_name=openai_api_key_secret_name,
            description="OpenAI API Key for Activity Database Chatbot",
            generate_secret_string=secretsmanager.SecretStringGenerator(
                secret_string_template='{"OPENAI_API_KEY": "your-api-key-placeholder"}',
                generate_string_key="OPENAI_API_KEY"
            )
        )

        # IAM Role for Lambda Functions
        lambda_execution_role = iam.Role(
            self, "LambdaExecutionRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole")
            ]
        )

        # Add S3 and Secrets Manager permissions to Lambda role
        lambda_execution_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=["s3:GetObject"],
                resources=[activity_bucket.arn_for_objects("*")]
            )
        )
        
        lambda_execution_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=["secretsmanager:GetSecretValue"],
                resources=[openai_api_key_secret.secret_arn]
            )
        )

        # Lambda Functions
        query_processor_function = lambda_.Function(
            self, "QueryProcessorFunction",
            function_name="activity-database-query-processor",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="lambda_function.lambda_handler",
            code=lambda_.Code.from_bucket(
                bucket=activity_bucket,
                key="lambda/query_processor.zip"
            ),
            role=lambda_execution_role,
            timeout=Duration.seconds(10),
            memory_size=256,
            environment={
                "OPENAI_API_KEY_SECRET": openai_api_key_secret.secret_name
            }
        )

        search_engine_function = lambda_.Function(
            self, "SearchEngineFunction",
            function_name="activity-database-search-engine",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="lambda_function.lambda_handler",
            code=lambda_.Code.from_bucket(
                bucket=activity_bucket,
                key="lambda/search_engine.zip"
            ),
            role=lambda_execution_role,
            timeout=Duration.seconds(10),
            memory_size=256,
            environment={
                "ACTIVITIES_BUCKET_NAME": activity_bucket.bucket_name,
                "ACTIVITIES_FILE_KEY": "activities.json"
            }
        )

        result_enhancer_function = lambda_.Function(
            self, "ResultEnhancerFunction",
            function_name="activity-database-result-enhancer",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="lambda_function.lambda_handler",
            code=lambda_.Code.from_bucket(
                bucket=activity_bucket,
                key="lambda/result_enhancer.zip"
            ),
            role=lambda_execution_role,
            timeout=Duration.seconds(10),
            memory_size=256,
            environment={
                "OPENAI_API_KEY_SECRET": openai_api_key_secret.secret_name
            }
        )

        # API Gateway
        api = apigateway.RestApi(
            self, "ApiGateway",
            rest_api_name="ActivityDatabaseChatbotAPI",
            description="API for Activity Database Chatbot",
            endpoint_types=[apigateway.EndpointType.REGIONAL]
        )

        # API Gateway Resources
        process_query_resource = api.root.add_resource("process-query")
        search_resource = api.root.add_resource("search")
        enhance_resource = api.root.add_resource("enhance")

        # Lambda Integrations
        process_query_integration = apigateway.LambdaIntegration(query_processor_function)
        search_integration = apigateway.LambdaIntegration(search_engine_function)
        enhance_integration = apigateway.LambdaIntegration(result_enhancer_function)

        # API Gateway Methods
        process_query_resource.add_method("POST", process_query_integration)
        search_resource.add_method("POST", search_integration)
        enhance_resource.add_method("POST", enhance_integration)

        # Outputs
        CfnOutput(
            self, "WebsiteURL",
            description="URL for the S3 website",
            value=activity_bucket.bucket_website_url
        )
        
        CfnOutput(
            self, "CloudFrontDistributionDomainName",
            description="Domain name for the CloudFront distribution",
            value=cloudfront_distribution.distribution_domain_name
        )
        
        CfnOutput(
            self, "APIEndpoint",
            description="API Gateway endpoint URL",
            value=f"{api.url}dev"
        )
