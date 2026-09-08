/** A human-readable index, so hitting the API root is not a 404. */
export default function ApiIndex() {
  return (
    <main style={{ fontFamily: 'ui-monospace, monospace', padding: '2rem', lineHeight: 1.7 }}>
      <h1>FireOxine API</h1>
      <p>
        The only service that reads the database. The storefront and the back office are separate
        apps and reach the catalogue through these routes.
      </p>
      <p>
        Health check: <a href="/api/health">/api/health</a>
      </p>
    </main>
  );
}
