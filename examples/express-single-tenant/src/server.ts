import { createAppContainer } from './container.js';
import { createAppRouter } from './routes.js';

const port = Number(process.env.PORT ?? 3001);
const container = createAppContainer();
const app = createAppRouter(container);

app.listen(port, () => {
  console.log(`express-single-tenant listening on http://localhost:${port}`);
});
