# Buď aktivní - mimoškolní aktivity

Code for database and chatbot interface with hybrid SEO + React architecture.

## 🚀 Deployment Strategies

### Development Environment (Fast Testing)
```bash
cd infrastructure/terraform
terraform apply -var-file="terraform.dev.tfvars"
```
- **No CloudFront**: Instant deployments
- **Direct S3 access**: No CDN overhead
- **Cost**: ~$1-2/month
- **Use case**: Testing, development, frequent changes

### Production Environment (Performance Optimized)
```bash
cd infrastructure/terraform
terraform apply -var-file="terraform.prod.tfvars"
```
- **CloudFront CDN**: Global performance
- **Optimized caching**: SEO + speed benefits
- **Cost**: ~$5-15/month (depending on traffic)
- **Use case**: Live site, SEO optimization

## 📊 Environment Comparison

| Feature | Development | Production |
|---------|-------------|------------|
| CloudFront CDN | ❌ Disabled | ✅ Enabled |
| Deployment Speed | ⚡ Instant | ⏱️ 5-15 min |
| Global Performance | 🐌 Regional only | 🚀 Worldwide |
| Caching | 📱 Browser only | 🌐 Edge + Browser |
| Cost (1K visitors) | 💰 $1/month | 💰 $2/month |
| SEO Optimization | ✅ Good | ✅ Excellent |