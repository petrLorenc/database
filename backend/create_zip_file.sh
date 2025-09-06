uv pip install \
   --no-installer-metadata \
   --no-compile-bytecode \
   --python-platform x86_64-manylinux2014 \
   --python 3.13 \
   --target packages \
   -r requirements.txt

# query_processor.zip will contain:
cd packages
zip -r ../query_processor.zip .
cd ..

cd functions/query_processor
zip -r ../../query_processor.zip lambda_function.py
cd ..
zip -r ../query_processor.zip utils.py
cd ..

# search_engine.zip will contain:
cd packages
zip -r ../search_engine.zip .
cd ..

cd functions/search_engine
zip -r ../../search_engine.zip lambda_function.py
cd ..
zip -r ../search_engine.zip utils.py
cd ..

# result_enhancer.zip will contain:
cd packages
zip -r ../result_enhancer.zip .
cd ..

cd functions/result_enhancer
zip -r ../../result_enhancer.zip lambda_function.py
cd ..
zip -r ../result_enhancer.zip utils.py
cd ..

# cleanup
mkdir -p deployments
mv query_processor.zip deployments/
mv search_engine.zip deployments/
mv result_enhancer.zip deployments/
rm -rf packages