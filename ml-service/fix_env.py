import sys
import subprocess
import pkg_resources

def check_and_install(package):
    try:
        pkg_resources.get_distribution(package)
        print(f"✅ {package} is already installed.")
    except pkg_resources.DistributionNotFound:
        print(f"❌ {package} not found. Installing...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", package])

print("--- Checking Critical Libraries ---")
check_and_install("sentencepiece")
check_and_install("protobuf")
check_and_install("transformers")
check_and_install("pillow")
print("\n--- Done! You can run main.py now. ---")
