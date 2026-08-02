import { fetchLeaderboard } from '../content.js';
import { localize } from '../util.js';

import Spinner from '../components/Spinner.js';

export default {
    components: {
        Spinner,
    },
    data: () => ({
        leaderboard: [],
        loading: true,
        selected: 0,
        err: [],
        search: '', // search string bound to input
    }),
    template: `
        <main v-if="loading">
            <Spinner></Spinner>
        </main>
        <main v-else class="page-leaderboard-container">
            <div class="page-leaderboard">
                <div class="error-container">
                    <p class="error" v-if="err.length > 0">
                        Leaderboard may be incorrect, as the following levels could not be loaded: {{ err.join(', ') }}
                    </p>
                </div>
                <div class="board-container">
                
                <!-- SEARCH BAR -->
                <div class="search-container">
                    <input
                        type="search"
                        v-model="search"
                        placeholder="Search players..."
                        aria-label="Search players"
                        class="search-input"
                    />
                    <button v-if="search" class="clear-btn" @click="search = ''">Clear</button>
                </div>
                    <table class="board">
                        <!-- iterate over filteredLeaderboard instead of leaderboard -->
                        <tr v-for="(ientry, i) in filteredLeaderboard" :key="ientry.user">
                            <td class="rank">
                                <p class="type-label-lg">#{{ i + 1 }}</p>
                            </td>
                            <td class="total">
                                <p class="type-label-lg">{{ localize(ientry.total) }}</p>
                            </td>
                            <td class="user" :class="{ 'active': selected == i }">
                                <button @click="selected = i">
                                    <span class="type-label-lg">{{ ientry.user }}</span>
                                </button>
                            </td>
                        </tr>

                        <!-- No results row when search is active but nothing matches -->
                        <tr v-if="search && filteredLeaderboard.length === 0">
                            <td colspan="3" class="no-results"></td>
                        </tr>
                    </table>
                </div>

                <!-- Player details shown only when there are results -->
                <div class="player-container" v-if="filteredLeaderboard.length > 0">
                    <div class="player">
                        <h1>#{{ selected + 1 }} {{ entry.user }}</h1>
                        <h3>{{ entry.total }}</h3>
                        <h2 v-if="entry.verified.length > 0">Verified ({{ entry.verified.length}})</h2>
                        <table class="table">
                            <tr v-for="score in entry.verified">
                                <td class="rank">
                                    <p>#{{ score.rank }}</p>
                                </td>
                                <td class="level">
                                    <a class="type-label-lg" target="_blank" :href="score.link">{{ score.level }}</a>
                                </td>
                                <td class="score">
                                    <p>+{{ localize(score.score) }}</p>
                                </td>
                            </tr>
                        </table>
                        <h2 v-if="entry.completed.length > 0">Completed ({{ entry.completed.length }})</h2>
                        <table class="table">
                            <tr v-for="score in entry.completed">
                                <td class="rank">
                                    <p>#{{ score.rank }}</p>
                                </td>
                                <td class="level">
                                    <a class="type-label-lg" target="_blank" :href="score.link">{{ score.level }}</a>
                                </td>
                                <td class="score">
                                    <p>+{{ localize(score.score) }}</p>
                                </td>
                            </tr>
                        </table>
                        <h2 v-if="entry.progressed.length > 0">Progressed ({{entry.progressed.length}})</h2>
                        <table class="table">
                            <tr v-for="score in entry.progressed">
                                <td class="rank">
                                    <p>#{{ score.rank }}</p>
                                </td>
                                <td class="level">
                                    <a class="type-label-lg" target="_blank" :href="score.link">{{ score.percent }}% {{ score.level }}</a>
                                </td>
                                <td class="score">
                                    <p>+{{ localize(score.score) }}</p>
                                </td>
                            </tr>
                        </table>
                    </div>
                </div>

                <!-- Message when search produced no results -->
                <div class="player-container" v-else>
                    <div class="player" style="height: 100%; justify-content: center; align-items: center;">
                        <p v-if="search">No players match "{{ search }}"</p>
                        <p v-else>(ノಠ益ಠ)ノ彡┻━┻</p>
                    </div>
                </div>
            </div>
        </main>
    `,
    computed: {
        // computed property that filters by the search string
        filteredLeaderboard() {
            if (!this.search) return this.leaderboard;
            const q = this.search.toLowerCase().trim();
            return this.leaderboard.filter((e) =>
                e.user.toLowerCase().includes(q),
            );
        },
        // use the filtered list for the detailed entry view
        entry() {
            return (
                this.filteredLeaderboard[this.selected] || {
                    user: '',
                    total: 0,
                    verified: [],
                    completed: [],
                    progressed: [],
                }
            );
        },
    },
    watch: {
        // when the search changes, reset selected to first filtered result
        search() {
            this.selected = 0;
        },
        // if the main leaderboard is replaced (after load), ensure selected is valid
        leaderboard() {
            this.selected = 0;
        },
    },
    async mounted() {
        const [leaderboard, err] = await fetchLeaderboard();
        this.leaderboard = leaderboard;
        this.err = err;
        // Hide loading spinner
        this.loading = false;
    },
    methods: {
        localize,
    },
};
