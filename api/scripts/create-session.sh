# This script creates a mock session on a server.
# During local dev/testing, you should run it in the api container,
# so the nest.js api can authenticate cookies against it.
#
# You should also set a cookie named 'unraid_...' whose value matches
# the name of the session you created (where name is sess_<name>).
# By default, this is my-session

sessions_dir=/var/lib/php
default_session_name=mock-user-session

if [ "$1" = "--help" ]; then
  echo "This script creates a mock session on a server."
  echo ""
  echo "Usage: $0 [options]"
  echo ""
  echo "Options:"
  echo "  [name]    Name of the session to create (default: mock-user-session)"
  echo "  --help    Display this help message and exit"
  echo ""
  echo "Example: $0 a-session-name"
  echo ""
  echo "Current list of sessions:"
  ls $sessions_dir
  exit 0
fi

session_name="${1:-$default_session_name}"

mkdir -p $sessions_dir
touch "$sessions_dir/sess_$session_name"

ls $sessions_dir
