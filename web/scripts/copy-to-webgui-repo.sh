#!/bin/bash

# copy-to-webgui-repo.sh
# =====================
# Copies built web components to your local webGUI repository
#
# Usage:
#   ./copy-to-webgui-repo.sh [OPTIONS] [WEBGUI_PATH]
#
# Options:
#   --wc-build[=y|n]  Control web component build
#                     =y: Force build (default if no value)
#                     =n: Skip build
#                     If not specified, will prompt
#
# Arguments:
#   WEBGUI_PATH       Path to webGUI directory
#                     Only required on first run or when path changes
#                     Path is stored in ~/.copy_to_webgui_state
#
# State Management:
#   The script stores the last used webGUI path in ~/.copy_to_webgui_state
#   This means you only need to specify the path once, unless it changes
#
# Examples:
#   First time:
#     ./copy-to-webgui-repo.sh --wc-build=y /path/to/webgui
#   Subsequent uses:
#     ./copy-to-webgui-repo.sh --wc-build=y
#     ./copy-to-webgui-repo.sh --wc-build=n
#     ./copy-to-webgui-repo.sh

# Check for --wc-build argument
if [[ "$1" == "--wc-build=y" || "$1" == "--wc-build=Y" ]]; then
    run_build="Y"
    shift
elif [[ "$1" == "--wc-build=n" || "$1" == "--wc-build=N" ]]; then
    run_build="N"
    shift
elif [[ "$1" == "--wc-build" ]]; then
    run_build="Y"  # Default to Y if no value specified
    shift
else
    # Prompt user about running build
    read -r -p "Run 'pnpm run build' to build the web components before copying? (Y/n) " run_build
fi

run_build=${run_build:-Y}

if [[ $run_build =~ ^[Yy]$ ]]; then
    echo "Build web components..."
    if ! pnpm run build; then
        echo "Error: Build failed! Aborting copy process."
        exit 1
    fi
fi

# Path to store the last used webgui path
state_file="$HOME/.copy_to_webgui_state"

# Read the last used webgui path from the state file
if [[ -f "$state_file" ]]; then
  last_webgui_path=$(cat "$state_file")
else
  last_webgui_path=""
fi

# Read the webgui path from the command-line argument or use the last used webgui path as the default
webgui_path="${1:-$last_webgui_path}"

# Check if the webgui path is provided
if [[ -z "$webgui_path" ]]; then
  echo "Please provide the absolute path to your webgui directory."
  exit 1
fi

# Ensure that the webgui path ends with a trailing slash
if [[ ! "$webgui_path" == */ ]]; then
  webgui_path="${webgui_path}/"
fi

# Save the current webgui path to the state file
echo "$webgui_path" > "$state_file"

echo "Removing the unraid-components/_nuxt directory as the hashes will be updated and we need to remove the old files..."
rm -rf "${webgui_path}emhttp/plugins/dynamix.my.servers/unraid-components/_nuxt"

# Replace the value inside the rsync command with the user's input
rsync_command="rsync -avz -e ssh .nuxt/nuxt-custom-elements/dist/unraid-components ${webgui_path}emhttp/plugins/dynamix.my.servers"

echo "Removing the irrelevant index.html file in the unraid-components directory..."
rm -f "${webgui_path}emhttp/plugins/dynamix.my.servers/unraid-components/index.html"

echo "Executing the following command:"
echo "$rsync_command"


# Execute the rsync command and capture the exit code
eval "$rsync_command"
exit_code=$?

# Play built-in sound based on the operating system
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  afplay /System/Library/Sounds/Glass.aiff
elif [[ "$OSTYPE" == "linux-gnu" ]]; then
  # Linux
  paplay /usr/share/sounds/freedesktop/stereo/complete.oga
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
  # Windows
  powershell.exe -c "(New-Object Media.SoundPlayer 'C:\Windows\Media\Windows Default.wav').PlaySync()"
fi

# Exit with the rsync command's exit code
exit $exit_code