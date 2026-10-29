export default function Home() {
  return (
    <main>
      <h1>auth-learn</h1>
      <p>Separate login pages for the three actor types:</p>
      <ul>
        <li><a href="/login/super-admin">Super Admin</a></li>
        <li><a href="/login/merchant">Merchant User</a></li>
        <li><a href="/login/customer">Customer</a></li>
      </ul>
    </main>
  );
}
