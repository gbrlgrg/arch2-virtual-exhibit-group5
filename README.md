# CSARCH2 Virtual Exhibit: Cache Memory Visualizer

An interactive virtual exhibit demonstrating **Cache Memory Mechanisms (Hits, Misses, and Locality)** using **Astro**, **React**, and **Framer Motion**.

---

# 📱 Proposed Virtual Exhibit Design

## Desktop Views

<p align="center">
  <img width="1090" alt="Desktop View 1" src="https://github.com/user-attachments/assets/c01a5f43-b57f-4ceb-8c19-b76b874f8e94" />
</p>

<p align="center">
  <img width="1087" alt="Desktop View 2" src="https://github.com/user-attachments/assets/3c3e3fa7-ef0a-4d06-8454-bb79edab9de7" />
</p>

## Mobile Views

<p align="center">
  <img width="220" alt="Mobile View 1" src="https://github.com/user-attachments/assets/542968fb-e0d6-475a-bfe2-6e3209fb6a65" />
  <img width="220" alt="Mobile View 2" src="https://github.com/user-attachments/assets/b3b1cfbb-2cb3-44f9-b50b-02c3adbfe648" />
  <img width="220" alt="Mobile View 3" src="https://github.com/user-attachments/assets/620f7a40-147c-4d91-971c-8ec8ec16622a" />
  <img width="220" alt="Mobile View 4" src="https://github.com/user-attachments/assets/404480bd-b70f-4c2a-9a64-1db789afc630" />
</p>

---

# 📝 Revisions Highlight (From Initial Submission)

To fully align with the project rubrics and feedback, our group made the following major revisions:

- **Refined Theme & Group Identity**
  - Changed the group name from **"CpU Later"** to **"Ca-Ching!"**
  - Narrowed the topic from the entire CPU architecture and Fetch-Decode-Execute cycle to **Cache Memory Mechanisms (Hits, Misses, and Locality)**.

- **Upgraded Interactive Element**
  - Replaced the calculator simulator with a **Dynamic CPU Cache Visualizer**.
  - Users input hexadecimal memory addresses, which are converted to binary and divided into **Tag**, **Index**, and **Offset** fields with animated visualization.

- **Modernized Tech Stack**
  - Added **ReactJS** and **Framer Motion** to the Astro framework for smooth real-time animations and interactions.

---

# Group Information

**Group Title:** Ca-Ching! (Group 5)

---

# Group Members

| Name | Role |
|------|------|
| Barreo, Carlo Gabriel | Member |
| Eleydo, Renzel Vince | Member |
| Gregorio, Gaibril Kyle | Member |
| Leano, Jeremy | Member |
| Rebudiao, Daniel Christian | Member |

---

# Topic Theme

## Caching! — How Cache Memory Works

---

# I. The Core Concept: How Cache Memory Works

## 1. The Hardware Speed Gap and Cache Memory

### The Hardware Speed Gap

CPUs have become incredibly fast, while main memory (RAM) has remained comparatively slow. This creates a bottleneck where a fast processor constantly waits for data from slower RAM.

### Cache Memory

Cache memory is a small, ultra-fast memory located on or near the CPU. It bridges the speed gap by storing frequently accessed data, allowing the processor to retrieve information much faster.

> Cache memory typically operates **10–100× faster** than RAM and responds within only a few nanoseconds.

---

## 2. Cache Hits vs. Cache Misses

### Cache Hit

A cache hit occurs when the requested data is already stored in cache memory, allowing the CPU to retrieve it immediately.

### Cache Miss

A cache miss occurs when the requested data is not found in cache memory. The CPU must retrieve it from lower memory levels such as L2/L3 cache or RAM, increasing access time.

### How Cache Hits and Misses Work

1. **CPU requests data** — The processor first checks cache memory.
2. **Cache lookup** — If the requested data exists in cache, a *hit* occurs and the CPU immediately uses the data.
3. **Cache miss** — If the data is unavailable in cache, the CPU searches lower memory levels until the data is found.
4. **Cache update** — After retrieving the missing data, the CPU stores a copy in cache so future requests can be served faster.

---

## 3. Principle of Locality

The **Principle of Locality** describes the tendency of programs to repeatedly access the same data and instructions, or to access data located near recently accessed memory. Applying this principle in cache design significantly improves cache effectiveness. There are two main types:

### Temporal Locality

If a memory location is accessed, it is likely to be accessed again soon. For example, in the loop below, the variable `total` is accessed repeatedly across iterations — keeping it in cache enables faster access each time:

```c
for (int i = 0; i < 1000; i++) {
    sum += total;
}
```

### Spatial Locality

If a memory location is accessed, nearby memory locations are likely to be accessed soon as well. For example, the array traversal below accesses `arr[i]` sequentially — since array elements are stored contiguously in memory, loading one cache block often brings in nearby elements that will soon be needed:

```c
for (int i = 0; i < 1000; i++) {
    sum += arr[i];
}
```

---

# II. Tech Stack Plan

### Proposed Interactive Element: CPU Cache Visualizer

Users simulate a CPU data request by typing a hexadecimal memory address. The visualizer then performs and displays the following steps:

**Address Breakdown**

- Converts the hex address to binary.
- Slices the binary bits into Tag, Index, and Offset fields.
- Animates lines or particle streams from each bit field to its corresponding location in the cache hardware.

**Cache Hit Visualization**

- Checks the calculated row index, confirms the valid bit is active, and verifies the address tag matches the stored tag.
- The targeted cache cell glows, the offset bits isolate the data, and a fast light-colored stream shoots back to the CPU with low-latency statistics displayed.

**Cache Miss Visualization**

- If the row is empty or tags do not match, a miss icon flashes and a slow gray data stream crawls down to RAM.
- RAM fetches a full memory block (exploiting spatial locality), overwrites the cache row metadata, and sends data back to the CPU with high-latency statistics displayed.

### Technical Stack

To ensure seamless integration with the central virtual museum repository, the project strictly uses the following technologies:

| Layer          | Technology                                          |
| -------------- | --------------------------------------------------- |
| Core Framework | Node.js 26 + Astro 6 (via `astro.build` template) |
| Interactivity  | ReactJS components embedded in Astro `.mdx` pages |
| Styling        | TailwindCSS + ShadcnUI                              |
| Animations     | Framer Motion                                       |

Framer Motion handles complex visual transitions, including animated address calculations and data flow between the CPU, cache, and RAM.

---

# III. Style Guide

The exhibit uses a **Cyber-Physical Glassmorphism** design system built with Tailwind CSS and ShadcnUI, optimized for both desktop and mobile viewing.

| Element              | Specification                                             |
| -------------------- | --------------------------------------------------------- |
| Background           | Deep dark mode —`slate-950`                            |
| Cache Hit Indicator  | Vibrant green and cyan glowing borders                    |
| Cache Miss Indicator | Muted gray and amber tones                                |
| Typography           | Sans-serif (Inter or Geist) for high readability          |
| Desktop Layout       | Split-panel view — Simulator (left) / Visualizer (right) |
| Mobile Layout        | Single scrollable column via responsive grid              |

**Design Principles**

- High-contrast, glowing accents indicate data flow between the CPU and memory hierarchy.
- Clean educational typography is used for Exhibit Notes accordion sections.
- Responsive grid ensures the layout adapts gracefully across all screen sizes.

---

# IV. References

- *Cache Miss vs Cache Hit: What's the Difference?* (2023, May 10). WP Rocket. https://wp-rocket.me/wordpress-cache/cache-miss-vs-cache-hit/
- Lutkevich, B. (2024, June 25). *Cache Memory*. TechTarget. https://www.techtarget.com/searchstorage/definition/cache-memory
