# Mini Zine Maker

Mini Zine Maker is a browser-only web app for turning up to eight photos into a printable one-page mini zine.

## What it does

- Loads up to eight images directly in the browser
- Lets you drag photos into the final page order
- Fits each photo on the page without cropping, centered with blank space when needed
- Allows blank pages when you want to leave part of the zine empty
- Shows the print sheet layout for a one-page folded mini zine
- Shows a folded booklet preview
- Exports the layout as a PNG or opens a print-friendly view

## Privacy

Photos are never uploaded anywhere. The app uses browser object URLs and canvas rendering locally on your machine.

## Run it

Open `index.html` in a browser.

If you prefer a local server, any static file server will work.

## Run it with Docker

Build the image:

```bash
docker build -t mini-zine .
```

Run the container:

```bash
docker run --rm -p 8080:80 mini-zine
```

Then open `http://localhost:8080`.
