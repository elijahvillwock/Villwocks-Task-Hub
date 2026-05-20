#!/bin/zsh
cd "$(dirname "$0")"
clear
echo "Starting Villwocks Task Hub"
echo "This window must stay open while you use the app."
echo ""

if ! command -v node >/dev/null 2>&1; then
  if [ -x "/Applications/Codex.app/Contents/Resources/node" ]; then
    NODE="/Applications/Codex.app/Contents/Resources/node"
  else
    echo "Node.js was not found on this Mac."
    echo "Install Node.js, then run this launcher again."
    echo ""
    read "reply?Press Return to close this window."
    exit 1
  fi
else
  NODE="$(command -v node)"
fi

"$NODE" server.js &
SERVER_PID=$!

echo "Waiting for the app to start..."
for attempt in {1..30}; do
  if curl -fsS "http://localhost:4173" >/dev/null 2>&1; then
    echo "App is running at http://localhost:4173"
    open -a "Google Chrome" "http://localhost:4173?from=launcher"
    echo ""
    echo "If Google sign-in complains, confirm this origin is in Google Cloud:"
    echo "http://localhost:4173"
    echo ""
    wait $SERVER_PID
    exit $?
  fi

  if ! kill -0 $SERVER_PID >/dev/null 2>&1; then
    echo ""
    echo "The app server stopped before it could start."
    echo "Look at the message above for the reason."
    echo ""
    read "reply?Press Return to close this window."
    exit 1
  fi

  sleep 1
done

echo ""
echo "The app did not respond at http://localhost:4173."
echo "Try closing this window and running the launcher again."
kill $SERVER_PID >/dev/null 2>&1
read "reply?Press Return to close this window."
