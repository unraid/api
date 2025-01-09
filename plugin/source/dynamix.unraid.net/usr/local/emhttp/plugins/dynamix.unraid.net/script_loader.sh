#!/bin/bash

# Debug log for env variable
echo "Current environment: ${env:-production}"

# Debug log for SCRIPT_HOME
echo "SCRIPT_HOME (if previously set): ${SCRIPT_HOME}"

# Set the script prefix based on environment
if [[ "${env}" == "staging" ]]; then
    PLUGIN_NAMESPACE="dynamix.unraid.net.staging"
else
    PLUGIN_NAMESPACE="dynamix.unraid.net"
fi

# Set the script home path
SCRIPT_HOME="/usr/local/emhttp/plugins/${PLUGIN_NAMESPACE}"

# Function to run a script with arguments
run_script() {
    local script_name="$1"
    local script="${SCRIPT_HOME}/${script_name}"
    shift
    if [[ -x "${script}" ]]; then
        "${script}" "$@"
    else
        if [[ -f "${script}" ]]; then
            echo "Script ${script} is not executable"
        else
            echo "Script ${script} not found"
        fi
        return 1
    fi
}

# Function to source a script with arguments
source_script() {
    local script_name="$1"
    local script="${SCRIPT_HOME}/${script_name}"
    shift
    if [[ -f "${script}" ]]; then
        # disable constant source warning bc dynamic sourcing is intentional
        # shellcheck disable=SC1090
        . "${script}" "$@"
    else
        echo "Script ${script} not found"
        return 1
    fi
}