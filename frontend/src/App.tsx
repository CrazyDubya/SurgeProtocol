/**
 * Surge Protocol - Main Application
 *
 * Production features:
 * - Error boundaries for graceful error handling
 * - Lazy loading for route components
 * - Suspense boundaries for loading states
 */

import { lazy, Suspense } from 'preact/compat';
import { Router, Route, Switch } from 'wouter-preact';
import { ThemeProvider } from '@components/layout/ThemeProvider';
import { Layout } from '@components/layout/Layout';
import { ProtectedRoute } from '@components/layout/ProtectedRoute';
import { ErrorBoundary } from '@components/layout/ErrorBoundary';
import { PageLoader } from '@components/ui/PageLoader';
import { ToastProvider } from '@components/ui';

// Auth pages (loaded immediately - critical path)
import { Login } from '@pages/Login';
import { Register } from '@pages/Register';
import { CharacterSelect } from '@pages/CharacterSelect';

// Protected pages (lazy loaded for code splitting)
const Dashboard = lazy(() => import('@pages/Dashboard').then((m) => ({ default: m.Dashboard })));
const Missions = lazy(() => import('@pages/Missions').then((m) => ({ default: m.Missions })));
const Algorithm = lazy(() => import('@pages/Algorithm').then((m) => ({ default: m.Algorithm })));
const Character = lazy(() => import('@pages/Character').then((m) => ({ default: m.Character })));
const Inventory = lazy(() => import('@pages/Inventory').then((m) => ({ default: m.Inventory })));
const Factions = lazy(() => import('@pages/Factions').then((m) => ({ default: m.Factions })));
const War = lazy(() => import('@pages/War').then((m) => ({ default: m.War })));
const CharacterCreate = lazy(() => import('@pages/CharacterCreate').then((m) => ({ default: m.CharacterCreate })));
const Contracts = lazy(() => import('@pages/Contracts').then((m) => ({ default: m.Contracts })));
const Crafting = lazy(() => import('@pages/Crafting').then((m) => ({ default: m.Crafting })));
const World = lazy(() => import('@pages/World').then((m) => ({ default: m.World })));
const Combat = lazy(() => import('@pages/Combat').then((m) => ({ default: m.CombatPage })));

const NotFound = lazy(() => import('@pages/NotFound').then((m) => ({ default: m.NotFound })));

/**
 * Protected page wrapper - applies Layout, ProtectedRoute, and Suspense
 */
function ProtectedPage({
  component: Component,
}: {
  component: preact.ComponentType;
}) {
  return (
    <Layout>
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <Component />
        </Suspense>
      </ProtectedRoute>
    </Layout>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
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
              <Route path="/factions">
                {() => <ProtectedPage component={Factions} />}
              </Route>
              <Route path="/war">
                {() => <ProtectedPage component={War} />}
              </Route>
              <Route path="/contracts">
                {() => <ProtectedPage component={Contracts} />}
              </Route>
              <Route path="/crafting">
                {() => <ProtectedPage component={Crafting} />}
              </Route>
              <Route path="/world">
                {() => <ProtectedPage component={World} />}
              </Route>
              <Route path="/combat/:combatId">
                {() => <ProtectedPage component={Combat} />}
              </Route>

              {/* Character creation - requires auth but not character */}
              <Route path="/create-character">
                {() => (
                  <ProtectedRoute requireCharacter={false}>
                    <Suspense fallback={<PageLoader />}>
                      <CharacterCreate />
                    </Suspense>
                  </ProtectedRoute>
                )}
              </Route>

              {/* 404 */}
              <Route>
                {() => (
                  <Layout>
                    <Suspense fallback={<PageLoader />}>
                      <NotFound />
                    </Suspense>
                  </Layout>
                )}
              </Route>
            </Switch>
          </Router>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
