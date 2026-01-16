/**
 * Surge Protocol - Main Application
 */

import { Router, Route, Switch } from 'wouter-preact';
import { ThemeProvider } from '@components/layout/ThemeProvider';
import { Layout } from '@components/layout/Layout';
import { ProtectedRoute } from '@components/layout/ProtectedRoute';

// Auth pages (public)
import { Login } from '@pages/Login';
import { Register } from '@pages/Register';
import { CharacterSelect } from '@pages/CharacterSelect';

// Protected pages
import { Dashboard } from '@pages/Dashboard';
import { Missions } from '@pages/Missions';
import { Algorithm } from '@pages/Algorithm';
import { Character } from '@pages/Character';
import { Inventory } from '@pages/Inventory';
import { NotFound } from '@pages/NotFound';

/**
 * Protected page wrapper - applies Layout and ProtectedRoute
 */
function ProtectedPage({
  component: Component,
}: {
  component: () => preact.JSX.Element;
}) {
  return (
    <Layout>
      <ProtectedRoute>
        <Component />
      </ProtectedRoute>
    </Layout>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <Router>
        <Switch>
          {/* Public auth routes */}
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />

          {/* Character select - requires auth but not character */}
          <Route path="/select-character">
            {() => (
              <ProtectedRoute requireCharacter={false}>
                <CharacterSelect />
              </ProtectedRoute>
            )}
          </Route>

          {/* Protected game routes */}
          <Route path="/">
            {() => <ProtectedPage component={Dashboard} />}
          </Route>
          <Route path="/missions">
            {() => <ProtectedPage component={Missions} />}
          </Route>
          <Route path="/algorithm">
            {() => <ProtectedPage component={Algorithm} />}
          </Route>
          <Route path="/character">
            {() => <ProtectedPage component={Character} />}
          </Route>
          <Route path="/inventory">
            {() => <ProtectedPage component={Inventory} />}
          </Route>

          {/* 404 */}
          <Route>
            {() => (
              <Layout>
                <NotFound />
              </Layout>
            )}
          </Route>
        </Switch>
      </Router>
    </ThemeProvider>
  );
}

export default App;
