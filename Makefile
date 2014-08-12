local-test:
	sleep 1 && open -a "Google Chrome" "http://localhost:8080/"
	python -m SimpleHTTPServer 8080

run:
	osascript ./reload-chrome.scpt

.PHONY: local-test
