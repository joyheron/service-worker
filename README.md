Server Worker Playground
------------------------

Based on [https://github.com/FND/service-worker-caching-strategies]

An application for playing around with service workers.

This basically activates a web crawler within the server worker to
add a version of the current version of the application to the
cache which a naive prefetch algorith (crawl over all links in the
response and add them to the cache if they aren't already there).

Then the application works offline.

The application is currently found within the `index.html` file.
When you want to run the application, you need to start a web
server to run the files.

Here a python server would be sufficient:

    python -m SimpleHTTPServer

It is also necessary to start the faucet-pipeline to compile the
service worker (necessary because we import a parser):

    npm install
    npm start
