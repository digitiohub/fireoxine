/**
 * The API serves JSON and the files under /public. It has no UI, but Next
 * still requires a root layout, so this is deliberately the whole of it.
 */
export const metadata = { title: 'FireOxine API' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
