# Lessons Learned

## Framer Motion Parallax Gaps
**Problem**: When creating a full-width parallax image break using Framer Motion's `useScroll` globally, mapping `scrollY` to absolute pixel values (e.g., `useTransform(scrollY, [0, 2000], [0, 300])`) causes clipping and gaps. The image gets pushed down too far relative to its container when the user scrolls deep into the page, exposing the background behind it.

**Solution**: Always use a ref-targeted scroll tracker for localized parallax sections:
```javascript
const sectionRef = useRef(null);
const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
});
const bgY = useTransform(scrollYProgress, [0, 1], ["-20%", "20%"]);
```
And apply `style={{ y: bgY, height: '140%' }}` with `-top-[20%]` on the image container to ensure it overhangs the block enough to allow for motion without exposing bounds.

## Invisible Pointer Events Bug
**Problem**: A full-screen invisible modal backdrop (`fixed inset-0 opacity-0`) used for a transition can accidentally capture all user click interactions if it always sets `pointer-events-auto`, effectively making the entire page unresponsive.

**Solution**: Always conditionally apply `pointer-events-auto` or `pointer-events-none` synchronized with the overlay's open/close state.
```jsx
<div className={`absolute inset-0 transition-opacity duration-500 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} />
```

## UX Call To Action Logic
**Problem**: The "Đặt Phòng" (Book Room) global floating action button on the result list page (AllRooms) redirects the user to the Homepage effectively breaking the user's flow and giving the impression of an application bug.

**Solution**: The action parameter inside localized or result components should either scroll the user to the relevant search component (e.g. `window.scrollTo({ top: 0, behavior: 'smooth' })`) or open a context-aware modal instead of arbitrarily jumping navigation contexts.

## req.body undefined Crash in Express
**Problem**: In backend Express applications, `req.body` is often `undefined` for `GET` requests instead of an empty object `{}`, especially depending on the `express.json()` configurations or content types. Accessing nested properties like `req.body.hotelId` crashes the app and yields a 500 Internal Server error.

**Solution**: Always defensively access `req.body`/`req.query`/`req.params` properties with optional chaining in globally used Express middleware:
```javascript
const hotelId = req.params?.hotelId || req.query?.hotelId || req.body?.hotelId;
```

## Native Datalist UI Inconsistency
**Problem**: The HTML `<datalist>` element bound to an `<input>` is rendered by the operating system/browser, which can lead to severe UI inconsistencies (e.g., black backgrounds, unreadable or overlapping text, unstylable dropdowns) in environments like Windows 11 Dark Mode mixed with light-themed websites.

**Solution**: Avoid using native `<datalist>` when a polished, consistent internal UI is needed. Instead, build a custom combobox dropdown with Tailwind CSS using `onFocus`, `onBlur` (with a slight timeout), and `onMouseDown` (to register clicks before the input loses focus), or adopt a Headless UI library.
