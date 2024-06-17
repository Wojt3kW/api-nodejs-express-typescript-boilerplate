# Description: Build the project for testing

echo ">>>>>>>>>> Removing dist folder"
WORKING_DIR=./dist
if [ -d "$WORKING_DIR" ]; then rm -Rf $WORKING_DIR; fi
WORKING_DIR=./dist/src

echo ">>>>>>>>>> Checking code style"
npm run lint


echo ">>>>>>>>>> Building the project"
npm run build

echo ">>>>>>>>>> Testing the project"
npm run test

echo ">>>>>>>>>> Copying the package.json file"
cp package.json "$WORKING_DIR"/package.json
cp package-lock.json "$WORKING_DIR"/package-lock.json

echo ">>>>>>>>>> Deleting logs folder"
rm -rf "$WORKING_DIR"/logs

echo ">>>>>>>>>> Deleting all tests"
find "$WORKING_DIR" -name tests -exec rm -R "{}" \;
find "$WORKING_DIR" -type f -name '*.spec.*' -delete
rm -rf "$WORKING_DIR"/utils/tests.utils.js
rm -rf "$WORKING_DIR"/utils/tests.utils.js.map
rm -rf "$WORKING_DIR"/utils/tests-events.utils.js
rm -rf "$WORKING_DIR"/utils/tests-events.utils.js.map


echo ">>>>>>>>>> Finished"
echo ">>>>>>>>>> Copy files from "$WORKING_DIR" to the server"
