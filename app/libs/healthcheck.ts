// run with deno run --allow-env --allow-net=localhost <script>
try {
    const PORT :number = Deno.env.get("PORT") ? parseInt(Deno.env.get("PORT")!) : 3000;
    const response = await fetch(`http://localhost:${PORT}`);
    Deno.exit(response.status === 200 ? 0 : 1);
} catch(err) {
    Deno.exit(1);
}
