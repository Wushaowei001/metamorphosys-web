pushd node_modules\webgme-domain-tools\executor_worker
echo {"http://localhost:8855": {}} > config.json

curl -f -o %userprofile%\Downloads\node-webkit-v0.9.2-win-ia32.zip -z %userprofile%\Downloads\node-webkit-v0.9.2-win-ia32.zip http://dl.node-webkit.org/v0.9.2/node-webkit-v0.9.2-win-ia32.zip
"c:\Program Files\7-Zip\7z.exe" x  %userprofile%\Downloads\node-webkit-v0.9.2-win-ia32.zip

cmd /c npm install
md log
popd