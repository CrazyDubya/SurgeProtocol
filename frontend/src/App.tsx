import { Router, Route, Switch } from 'wouter-preact';
import { ThemeProvider } from '@components/layout/ThemeProvider';
import { Layout } from '@components/layout/Layout';
import { Dashboard } from '@pages/Dashboard';
import { Missions } from '@pages/Missions';
import { Character } from '@pages/Character';
import { Inventory } from '@pages/Inventory';
import { NotFound } from '@pages/NotFound';

export function App() {
  return (
    <ThemeProvider>
      <Router>
        <Layout>
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/missions" component={Missions} />
            <Route path="/character" component={Character} />
            <Route path="/inventory" component={Inventory} />
            <Route component={NotFound} />
          </Switch>
        </Layout>
      </Router>
    </ThemeProvider>
  );
}
