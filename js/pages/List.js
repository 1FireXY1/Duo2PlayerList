import { store } from "../main.js";
import { embed } from "../util.js";
import { score } from "../score.js";
import { fetchEditors, fetchList } from "../content.js";

import Spinner from "../components/Spinner.js";
import LevelAuthors from "../components/List/LevelAuthors.js";

const roleIconMap = {
    owner: "crown",
    admin: "user-gear",
    helper: "user-shield",
    dev: "code",
    trial: "user-lock",
};

export default {
    components: { Spinner, LevelAuthors },
    template: `
        <main v-if="loading">
            <Spinner></Spinner>
        </main>
        <main v-else class="page-list">
            <div class="list-container" style="margin-bottom:12px;">
                <!-- Search box -->
                <div class="list-search" style="margin-bottom:12px;">
                    <input
                        v-model="searchQuery"
                        type="search"
                        placeholder="Search levels, authors, IDs, record users..."
                        class="search-input"
                        aria-label="Search list"
                    />
                    <button v-if="searchQuery" class="clear-btn" @click="searchQuery = ''">Clear</button>
                </div>

                <table class="list" v-if="list && filteredList.length">
                    <tr v-for="({ level, err, origIndex }, i) in filteredList" :key="origIndex">
                        <td class="rank">
                            <p v-if="origIndex + 1 <= 50" class="type-label-lg">#{{ origIndex + 1 }}</p>
                            <p v-else class="type-label-lg">Legacy</p>
                        </td>
                        <td class="level" :class="{ 'active': selected == origIndex, 'error': !level }">
                            <button @click="selected = origIndex">
                                <span class="type-label-lg">{{ level?.name || \`Error (\${err}.json)\` }}</span>
                            </button>
                        </td>
                    </tr>
                </table>

                <div v-else class="no-results" v-if="list" style="margin-bottom:12px;">
                    <p>No results found.</p>
                </div>
            </div>

            <div class="level-container">
                <div class="level" v-if="level">
                    <h1>{{ level.name }}</h1>
                    <LevelAuthors :author="level.author" :creators="level.creators" :verifiers="level.verifiers"></LevelAuthors>
                    <iframe class="video" id="videoframe" :src="video" frameborder="0"></iframe>
                    <ul class="stats">
                        <li>
                            <div class="type-title-sm">Points when completed</div>
                            <p>{{ score(selected + 1, 100, level.percentToQualify) }}</p>
                        </li>
                        <li>
                            <div class="type-title-sm">ID</div>
                            <p>{{ level.id }}</p>
                        </li>
                        <li>
                            <div class="type-title-sm">Password</div>
                            <p>{{ level.password || 'Free to Copy' }}</p>
                        </li>
                    </ul>
                    <h2>Records</h2>
                    <p v-if="selected + 1 <= 75"><strong>{{ level.percentToQualify }}%</strong> or better to qualify</p>
                    <p v-else-if="selected +1 <= 45"><strong>100%</strong> or better to qualify</p>
                    <p v-else>This level does not accept new records.</p>
                    <table class="records">
                        <tr v-for="record in level.records" class="record">
                            <td class="percent">
                                <p>{{ record.percent }}%</p>
                            </td>
                            <td class="user">
                                <a :href="record.link" target="_blank" class="type-label-lg">{{ record.user }}</a>
                            </td>
                            <td class="mobile">
                                <img v-if="record.mobile" :src="\`/assets/phone-landscape\${store.dark ? '-dark' : ''}.svg\`" alt="Mobile">
                            </td>
                            <td class="hz">
                                <p>{{ record.hz }}Hz</p>
                            </td>
                        </tr>
                    </table>
                </div>
                <div v-else class="level" style="height: 100%; justify-content: center; align-items: center;">
                    <p>(ノಠ益ಠ)ノ彡┻━┻</p>
                </div>
            </div>
            <div class="meta-container">
                <div class="meta">
                    <div class="errors" v-show="errors.length > 0">
                        <p class="error" v-for="error of errors">{{ error }}</p>
                    </div>
                    <div class="og">
                        <p class="type-label-md">Website layout made by <a href="https://tsl.pages.dev/" target="_blank">TheShittyList</a></p>
                    </div>
                    <template v-if="editors">
                        <h3>List Editors</h3>
                        <ol class="editors">
                            <li v-for="editor in editors">
                                <img :src="\`/assets/\${roleIconMap[editor.role]}\${store.dark ? '-dark' : ''}.svg\`" :alt="editor.role">
                                <a v-if="editor.link" class="type-label-lg link" target="_blank" :href="editor.link">{{ editor.name }}</a>
                                <p v-else>{{ editor.name }}</p>
                            </li>
                        </ol>
                    </template>
                    <h3>Submission Requirements</h3>
                    <p>
                        To be added, example below
                    </p>
                    <p>
                        Achieved the record without using hacks (however, FPS bypass is allowed, up to 360fps)
                    </p>
                    <p>
                        Achieved the record on the level that is listed on the site - please check the level ID before you submit a record
                    </p>
                    <p>
                        Have either source audio or clicks/taps in the video. Edited audio only does not count
                    </p>
                    <p>
                        The recording must have a previous attempt and entire death animation shown before the completion, unless the completion is on the first attempt. Everyplay records are exempt f[...]
                    </p>
                    <p>
                        The recording must also show the player hit the endwall, or the completion will be invalidated.
                    </p>
                    <p>
                        Do not use secret routes or bug routes
                    </p>
                    <p>
                        Do not use easy modes, only a record of the unmodified level qualifies
                    </p>
                    <p>
                        Once a level falls onto the Legacy List, we accept records for it for 24 hours after it falls off, then afterwards we never accept records for said level
                    </p>
                </div>
            </div>
        </main>
    `,
    data: () => ({
        list: [],
        editors: [],
        loading: true,
        selected: 0,
        errors: [],
        roleIconMap,
        store,
        // search state
        searchQuery: ''
    }),
    computed: {
        // Keep level selection based on original list indices.
        level() {
            if (!this.list || !this.list.length) return null;
            if (!this.list[this.selected]) return null;
            return this.list[this.selected][0];
        },
        video() {
            if (!this.level) return "";
            if (!this.level.showcase) {
                return embed(this.level.verification);
            }

            return embed(
                this.toggledShowcase
                    ? this.level.showcase
                    : this.level.verification
            );
        },
        // filteredList returns objects so we can preserve original indices
        filteredList() {
            if (!this.list) return [];
            const q = this.searchQuery.trim().toLowerCase();
            const mapped = this.list.map(([level, err], idx) => ({ level, err, origIndex: idx }));

            if (!q) return mapped;

            return mapped.filter(({ level, err }) => {
                // if level failed to load, allow searching the error filename
                if (!level) {
                    return err && err.toString().toLowerCase().includes(q);
                }

                // fields to search
                const fields = [];

                if (level.name) fields.push(level.name);
                if (level.id !== undefined && level.id !== null) fields.push(String(level.id));
                if (level.password) fields.push(level.password);
                if (level.author) {
                    // author might be a string or object
                    if (typeof level.author === "string") fields.push(level.author);
                    else if (level.author.name) fields.push(level.author.name);
                }
                if (level.creators && Array.isArray(level.creators)) fields.push(level.creators.join(" "));
                if (level.verifiers && Array.isArray(level.verifiers)) fields.push(level.verifiers.join(" "));
                if (level.records && Array.isArray(level.records)) fields.push(level.records.map(r => r.user || "").join(" "));

                return fields.some(f => f && f.toString().toLowerCase().includes(q));
            });
        },
    },
    watch: {
        // Keep selection valid when search filters the selected item out
        filteredList(newList) {
            if (!newList || !newList.length) return;
            const stillSelected = newList.some(item => item.origIndex === this.selected);
            if (!stillSelected) {
                // set selection to the first filtered item (use its original index)
                this.selected = newList[0].origIndex;
            }
        }
    },
    async mounted() {
        // Hide loading spinner
        this.list = await fetchList();
        this.editors = await fetchEditors();

        // Error handling
        if (!this.list) {
            this.errors = [
                "Failed to load list. Retry in a few minutes or notify list staff.",
            ];
        } else {
            this.errors.push(
                ...this.list
                    .filter(([_, err]) => err)
                    .map(([_, err]) => {
                        return `Failed to load level. (${err}.json)`;
                    })
            );
            if (!this.editors) {
                this.errors.push("Failed to load list editors.");
            }
        }

        this.loading = false;
    },
    methods: {
        embed,
        score,
    },
};
