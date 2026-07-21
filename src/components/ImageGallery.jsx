/**
 * ImageGallery.jsx
 *
 * An interactive, single-photo carousel. It shows one image at a time and lets
 * the viewer move between photos using arrow buttons, the keyboard, or the dots
 * below the image.
 *
 * ## Learning Notes
 * This component demonstrates several key React concepts:
 * - Function component: A component is just a function that returns JSX (the
 *   HTML-like markup you see in the `return`).
 * 
 * - Props: Data passed in from the parent (here, the `photos` array). We give
 *   it a default of `[]` so the component never crashes if it's left out.
 * 
 * - State with useState: `current` remembers which photo is showing. Calling
 *   `setCurrent` tells React to re-render with the new value.
 * 
 * - Side effects with useEffect: Used here to listen for keyboard presses and
 *   to clean that listener up when the component is removed.
 * 
 * - Inline styles: Styles are plain JS objects (see the `styles` object at the
 *   bottom). CSS property names become camelCase, e.g. `font-size` -> `fontSize`.
 *
 * ## Props
 *   - photos (Array) – Required. A list of photo objects (shape below).
 *
 * ## Photo object shape
 *   {
 *     id:      number | string  – unique key React uses to track each item (required)
 *     title:   string           – caption title
 *     author:  string           – who took/made it
 *     year:    number | string  – year taken
 *     img:     string           – image URL or path (required)
 *     tagline: string           – optional italic line under the title
 *     url:     string           – optional link; clicking the image opens it
 *   }
 *
 * ## Usage Example
 *   const myPhotos = [
 *     { id: 1, title: "Sunrise", author: "Ada", year: 2021, img: "/sunrise.jpg" },
 *     { id: 2, title: "Skyline", author: "Lin", year: 2022, img: "/skyline.jpg" },
 *   ];
 *
 *   <ImageGallery photos={myPhotos} />
 */

import { useState, useEffect } from "react";

export default function ImageGallery({ photos = [] }) {
  // `current` is the index of the photo on screen. It starts at 0 (the first photo).
  // `setCurrent` is the only way to change it -- React re-renders whenever we call it.
  const [current, setCurrent] = useState(0);

  const total = photos.length;

  // Move forward or backward. `dir` is +1 (next) or -1 (previous).
  // The modulo (% total) makes the gallery wrap around: going past the last photo
  // returns to the first, and going before the first jumps to the last.
  // Adding `total` before the % keeps the result positive when `dir` is -1.
  const go = (dir) => {
    setCurrent((prev) => (prev + dir + total) % total);
  };

  // Jump straight to a specific photo (used by the dot indicators).
  const goTo = (i) => setCurrent(i);

  // Listen for the left/right arrow keys so the gallery is keyboard-navigable.
  // useEffect runs after render. The function it returns is the "cleanup": React
  // calls it to remove the listener so we don't stack up duplicates or leak memory.
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [total]); // re-attach if the number of photos changes

  // Guard clause: if no photos were passed in, show a friendly message instead
  // of crashing when we try to read photos[current] below.
  if (!total) {
    return <div style={styles.empty}>Error: No photos included</div>;
  }

  // The photo currently being shown.
  const photo = photos[current];

  return (
    <div style={styles.root}>
      {/* Stage: the framed area that holds the sliding images */}
      <div style={styles.stage}>
        {/* All photos sit in one horizontal strip. We slide the whole strip
            sideways with translateX so only the "current" photo is visible.
            Moving by `current * 100`% shifts it one full image width per step. */}
        <div
          style={{
            ...styles.strip,
            transform: `translateX(-${current * 100}%)`,
          }}
        >
          {/* .map() turns each photo object into a slide. The `key` prop (p.id)
              helps React tell the slides apart efficiently. */}
          {photos.map((p) => (
            <div key={p.id} style={styles.slide}>
              {/* If the photo has a url, wrap the image in a link; otherwise show
                  the image on its own. This is a ternary: condition ? a : b */}
              {p.url ? (
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.imgLink}
                  aria-label={`Visit the ${p.title} website`}
                >
                  <img src={p.img} alt={p.title} style={styles.img} loading="lazy" />
                </a>
              ) : (
                <img src={p.img} alt={p.title} style={styles.img} loading="lazy" />
              )}
            </div>
          ))}
        </div>

        {/* Previous / next buttons. onClick calls go() with the direction.
            aria-label gives screen readers a description of each button. */}
        <button
          style={{ ...styles.navBtn, left: 12 }}
          onClick={() => go(-1)}
          aria-label="Previous photo"
        >
          ‹
        </button>
        <button
          style={{ ...styles.navBtn, right: 12 }}
          onClick={() => go(1)}
          aria-label="Next photo"
        >
          ›
        </button>

        {/* Counter, e.g. "2 / 5". current is 0-based, so we add 1 for display. */}
        <span style={styles.counter}>
          {current + 1} / {total}
        </span>
      </div>

      {/* Caption below the image. Some fields are optional, so tagline only
          renders when it exists (the && short-circuit pattern). */}
      <div style={styles.caption}>
        <div>
          <div style={styles.captionTitle}>{photo.title}</div>
          {photo.tagline && (
            <div style={styles.captionTagline}>{photo.tagline}</div>
          )}
          <div style={styles.captionMeta}>
            {photo.author} / {photo.year}
          </div>
        </div>
      </div>

      {/* Dot indicators: one dot per photo. The active dot is darker and larger.
          We compare each index `i` against `current` to decide its style. */}
      <div style={styles.dots}>
        {photos.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Go to photo ${i + 1}`}
            style={{
              ...styles.dot,
              background: i === current ? "#111" : "#ccc",
              transform: i === current ? "scale(1.4)" : "scale(1)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

// -- Styles -----------------------------------------------
// Inline styles are plain objects: keys are camelCased CSS properties, values are
// strings or numbers (numbers become pixels). We spread (...) these into elements
// above, sometimes adding extra properties on top.
const styles = {
  root: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    fontFamily: "sans-serif",
    maxWidth: 800,
    margin: "0 auto",
  },
  stage: {
    position: "relative", // lets the buttons/counter position against this box
    borderRadius: 12,
    overflow: "hidden", // hides the off-screen slides
    background: "#f1efe8",
    aspectRatio: "16 / 10",
    width: "100%",
  },
  strip: {
    display: "flex",
    height: "100%",
    transition: "transform 0.4s cubic-bezier(0.4,0,0.2,1)", // smooth slide animation
  },
  slide: {
    minWidth: "100%", // each slide fills the stage exactly
    height: "100%",
    flexShrink: 0,
  },
  img: {
    width: "100%",
    height: "100%",
    objectFit: "cover", // fill the slide, cropping if needed, without distortion
    display: "block",
  },
  imgLink: {
    display: "block",
    width: "100%",
    height: "100%",
  },
  navBtn: {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)", // nudge up by half its height to truly center
    width: 40,
    height: 40,
    borderRadius: "50%",
    border: "1px solid rgba(255,255,255,0.35)",
    background: "rgba(0,0,0,0.35)",
    color: "#fff",
    cursor: "pointer",
    fontSize: 24,
    lineHeight: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2, // sit above the image
    transition: "background 0.15s, opacity 0.15s",
  },
  counter: {
    position: "absolute",
    bottom: 12,
    right: 14,
    fontSize: 12,
    fontWeight: 500,
    color: "#fff",
    background: "rgba(0,0,0,0.45)",
    padding: "3px 10px",
    borderRadius: 999, // a large radius makes a pill shape
  },
  caption: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  captionTitle: {
    fontSize: 16,
    fontWeight: 500,
    color: "#111",
    marginBottom: 2,
  },
  captionTagline: {
    fontSize: 14,
    fontStyle: "italic",
    color: "#444",
    marginBottom: 4,
  },
  captionMeta: {
    fontSize: 13,
    color: "#666",
  },
  dots: {
    display: "flex",
    gap: 6,
    justifyContent: "center",
    flexWrap: "wrap",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    border: "none",
    padding: 0,
    cursor: "pointer",
    transition: "background 0.2s, transform 0.2s",
  },
  empty: {
    textAlign: "center",
    padding: "3rem",
    color: "#888",
    fontSize: 14,
  },
};
