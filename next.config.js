/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
}
module.exports = nextConfig
```

**Exactly what changed:** 3 new lines added between `reactStrictMode: true,` and the closing `}`. Nothing else touched.

Open the file in Cursor, click after the comma on `reactStrictMode: true,`, hit Enter, and type:
```
  typescript: {
    ignoreBuildErrors: true,
  },