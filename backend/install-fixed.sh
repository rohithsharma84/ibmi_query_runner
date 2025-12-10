#!/bin/bash
# Installation script for node-jt400 with JAVA_HOME configuration

# Set JAVA_HOME for IBM i
export JAVA_HOME=/QOpenSys/QIBM/ProdData/JavaVM/jdk21/64bit
export PATH=$JAVA_HOME/bin:$PATH

# Verify Java is accessible
echo "Checking Java installation..."
if [ ! -d "$JAVA_HOME" ]; then
    echo "ERROR: JAVA_HOME directory not found: $JAVA_HOME"
    echo "Please verify your Java installation path"
    exit 1
fi

echo "JAVA_HOME: $JAVA_HOME"
echo "Java version:"
java -version

# Verify Python
echo ""
echo "Python version:"
python3 --version

# The java package reads JAVA_HOME environment variable during installation
echo ""
echo "JAVA_HOME is set and will be used by npm during installation"

# Clean any previous failed installations
echo ""
echo "Cleaning previous installation attempts..."
rm -rf node_modules package-lock.json

# Run npm install
echo ""
echo "Running npm install with JAVA_HOME=$JAVA_HOME..."
npm install

# Check if installation was successful
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Installation completed successfully!"
    echo ""
    echo "To make JAVA_HOME permanent, add this to your ~/.bashrc:"
    echo "export JAVA_HOME=/QOpenSys/QIBM/ProdData/JavaVM/jdk21/64bit"
    echo "export PATH=\$JAVA_HOME/bin:\$PATH"
else
    echo ""
    echo "❌ Installation failed. Check the error messages above."
    exit 1
fi