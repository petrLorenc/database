#!/bin/bash

# Create temporary directories
mkdir -p deployments
mkdir -p python  # For Lambda layer

# Install dependencies to python directory (for Lambda layer)
uv pip install \
   --no-installer-metadata \
   --no-compile-bytecode \
   --python-platform x86_64-manylinux2014 \
   --python 3.10 \
   --target python \
   -r requirements.txt

cp ./functions/utils.py python/utils.py

# Create Lambda layer ZIP
zip -r ./deployments/lambda_layer.zip python/
# cd ..

# # Create function ZIPs (just the handler code)
# zip -j deployments/query_processor.zip functions/query_processor/lambda_function.py functions/utils.py
# zip -j deployments/search_engine.zip functions/search_engine/lambda_function.py functions/utils.py
# zip -j deployments/result_enhancer.zip functions/result_enhancer/lambda_function.py functions/utils.py

# Cleanup
rm -rf python