local-test:
	sleep 1 && open -a "Google Chrome" "http://localhost:8080/"
	python -m SimpleHTTPServer 8080

.PHONY: local-test
