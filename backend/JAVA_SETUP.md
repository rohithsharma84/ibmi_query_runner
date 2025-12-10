# Java Setup for node-jt400

## Issue
The `java` package (required by node-jt400) needs the `JAVA_HOME` environment variable set during npm install.

## Error
```
gyp: Undefined variable javahome in binding.gyp while trying to load binding.gyp
```

## Solution

### Set JAVA_HOME before running npm install

Based on your Java installation at `/QOpenSys/QIBM/ProdData/JavaVM/jdk21/64bit`, set the environment variable:

```bash
export JAVA_HOME=/QOpenSys/QIBM/ProdData/JavaVM/jdk21/64bit
export PATH=$JAVA_HOME/bin:$PATH
```

### Verify Java Setup
```bash
echo $JAVA_HOME
java -version
```

### Run npm install
```bash
cd /home/sharmar1/ibmi_query_runner/backend
npm install
```

## Permanent Setup

To make this permanent, add to your `~/.bashrc` or `~/.profile`:

```bash
# Java Configuration for node-jt400
export JAVA_HOME=/QOpenSys/QIBM/ProdData/JavaVM/jdk21/64bit
export PATH=$JAVA_HOME/bin:$PATH
```

Then reload:
```bash
source ~/.bashrc
```

## Alternative: Set in npm config

You can also set it in npm configuration:
```bash
npm config set java_home /QOpenSys/QIBM/ProdData/JavaVM/jdk21/64bit
```

## Verification

After setting JAVA_HOME and running npm install successfully, verify the installation:

```bash
node -e "const jt400 = require('node-jt400'); console.log('node-jt400 loaded successfully');"