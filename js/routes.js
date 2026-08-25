import List from './pages/List.js';
import Leaderboard from './pages/Leaderboard.js';
import Legacy from './pages/LegacyList.js';
import Roulette from './pages/Roulette.js';

export default [
    { path: '/', component: List },
    { path: '/leaderboard', component: Leaderboard },
    { path: '/legacylist', component: Legacy },
    { path: '/roulette', component: Roulette },
];
