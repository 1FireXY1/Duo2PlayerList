import { store } from "../main.js";
import { embed } from "../util.js";
import { score } from "../score.js";
import { fetchEditors, fetchLegacyList } from "../content.js";

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
    <main v-else class="page-legacylist">
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
        this.list = await fetchLegacyList();
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
