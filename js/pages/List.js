import { store } from "../main.js";
import { embed } from "../util.js";
import { score } from "../score.js";
import { fetchEditors, fetchList } from "../content.js";

import Spinner from "../components/Spinner.js";
import "../css/animations.css";
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
      <div class="list-container">
        <!-- SEARCH BOX -->
        <div class="search-container" style="margin-bottom:12px;">
          <input
            type="search"
            v-model="search"
            placeholder="Search..."
            aria-label="Search"
            class="search-input"
          />
          <button v-if="search" class="clear-btn" @click="search = ''">Clear</button>
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
        <!-- TRANSITION WRAPPER: Appear so it runs on initial mount too -->
        <transition name="level-transition" mode="out-in" appear>
          <!-- key by selected so Vue replaces this node on selection changes -->
          <div class="level" v-if="level" :key="selected">
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
                <div class="type-title-sm">Globed</div>
                <p>{{ level.globed }}</p>
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

          <!-- Fallback empty-state also keyed so it animates in/out -->
          <div class="level" v-else style="height: 100%; justify-content: center; align-items: center;" :key="'no-level-'+selected">
            <p>(ノಠ益ಠ)ノ彡┻━┻</p>
          </div>
        </transition>
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
                    <h3>Placement Requirements</h3>
                    <p>
                        For a level to be placed on the list, at least 35% of the level's gameplay must be 2P dual. This does NOT count completely symmetrical gameplay, simultaneous clicks, or mini-games.
                    </p>
                    <p>
                        2P levels that were intended to be solo must have the 2P parts contain most of the difficulty of the level. These levels also apply to the rules above.
                    </p>
                    <p>
                        Levels will be placed based on community difficulty opinions. If you'd like to add your own opinion on placements, please send them in our Discord server.
                    </p>
                    <p>
                        If an unrated level is deemed to be of rate-worthy quality, it may also be added to the list. This is done by community vote.
                    </p>
                    <h3>Submission Requirements</h3>
                    <p>
                        Your record must be done with two or more people. This means that solo records will NOT be accepted. There is a list named the 2PLL, go there to submit such records.
                    </p>
                    <p>
                        If you already have a completion accepted on AREDL, let us know in our Discord server and we can add the corresponding record to our list.
                    </p>
                    <p>
                        You must have a green cheat indicator visible during your completion as well as during the endscreen.
                    </p>
                    <p>
                        The recording must have a previous attempt and entire death animation shown before the completion, unless the completion is on the first attempt. If it is first attempt, please add footage from before pressing the play button.
                    </p>
                    <p>
                        Any levels placed #51 and below are on the legacy list. We will accept records on levels for 24 hours after they fall off the top #50. After this time is up, submissions for said levels will be closed and not accepted further.
                    </p>
                    <p>
                        You must achieve your record with the ID listed on the site. If it is a Globed copy, there is another separate ID listed that you must use.
                    </p>
                    <p>
                        If there is not a Globed copy listed and you'd like to add one, please let us know on Discord in our list support form.
                    </p>
                    <p>
                        Custom copies are only allowed as long as they are previously approved by list moderators. If you use a Globed copy listed on this site, you don't have to worry about approval as they are already approved.
                    </p>
                    <p>
                        The recording must show the endscreen in its entirety. This means stars gained (unless it is not on the official copy) as well as the cheat indicator.
                    </p>
                    <p>
                        Each record requires clicks to be audible throughout the entire completion.
                    </p>
                    <p>
                        You may not utilize secret ways or bugged routes.
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
        search: ''
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
            const q = this.search.trim().toLowerCase();
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
