const { createApp, computed, ref, watch, onMounted } = Vue;

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function formatDateKey(date) {
  return date.toISOString().split("T")[0];
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function getDayStatus(tasks) {
  if (!tasks || tasks.length === 0) return "danger"; // no tasks logged
  const completed = tasks.filter((t) => t.completed).length;
  if (completed === tasks.length) return "success";
  if (completed === 0) return "danger";
  return "warning";
}

function normalizeStatus(status) {
  if (!status) return "danger";
  return status.toLowerCase();
}

const today = new Date();
const initialMonth = startOfMonth(today);

createApp({
  setup() {
    const currentMonth = ref(startOfMonth(initialMonth));
    const selectedDate = ref(formatDateKey(today));
    const monthSummary = ref(null);
    const loading = ref(false);
    const error = ref("");
    const expandedYears = ref(new Set([today.getFullYear()]));

    async function loadMonth(date) {
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      loading.value = true;
      error.value = "";
      try {
        const response = await fetch(`/api/months/${year}/${month}`);
        if (!response.ok) {
          throw new Error(`Failed to load month: ${response.status}`);
        }
        const data = await response.json();
        monthSummary.value = data;
        const firstOfMonth = formatDateKey(startOfMonth(date));
        if (!data.days.some((day) => day.date === selectedDate.value)) {
          selectedDate.value = firstOfMonth;
        }
      } catch (err) {
        error.value = err.message || "Failed to load month";
      } finally {
        loading.value = false;
      }
    }

    const dayMap = computed(() => {
      const map = {};
      if (!monthSummary.value) return map;
      monthSummary.value.days.forEach((day) => {
        map[day.date] = day;
      });
      return map;
    });

    const tasksByDate = computed(() => {
      const map = {};
      if (!monthSummary.value) return map;
      monthSummary.value.days.forEach((day) => {
        map[day.date] = day.tasks || [];
      });
      return map;
    });

    const calendarDays = computed(() => {
      const start = startOfMonth(currentMonth.value);
      const end = endOfMonth(currentMonth.value);
      const days = [];
      const startOffset = (start.getDay() + 6) % 7; // Monday as first day
      for (let i = 0; i < startOffset; i++) {
        days.push({ label: "", date: null });
      }
      for (let day = 1; day <= end.getDate(); day++) {
        const date = new Date(start.getFullYear(), start.getMonth(), day);
        const dateKey = formatDateKey(date);
        const dayEntry = dayMap.value[dateKey];
        const dayTasks = dayEntry?.tasks || [];
        days.push({
          label: day,
          date: dateKey,
          tasks: dayTasks,
          status: normalizeStatus(dayEntry?.status || getDayStatus(dayTasks)),
        });
      }
      return days;
    });

    const monthStats = computed(() => {
      const stats = { success: 0, warning: 0, danger: 0, longestStreak: 0 };
      const sequence = [];
      calendarDays.value
        .filter((d) => d.date)
        .forEach((day) => {
          stats[day.status] += 1;
          sequence.push(day.status === "success");
        });
      const longestStreak = sequence.reduce(
        (acc, done) => {
          const current = done ? acc.current + 1 : 0;
          return { current, longest: Math.max(acc.longest, current) };
        },
        { current: 0, longest: 0 }
      ).longest;
      return { ...stats, longestStreak };
    });

    const yearTree = computed(() => {
      const year = currentMonth.value.getFullYear();
      const months = monthNames.map((name, index) => ({
        name,
        index,
        label: `${name}`,
        key: `${year}-${index + 1}`,
      }));
      return [
        {
          year,
          months,
        },
      ];
    });

    function selectDay(day) {
      if (!day.date) return;
      selectedDate.value = day.date;
    }

    function setMonth(index) {
      currentMonth.value = new Date(currentMonth.value.getFullYear(), index, 1);
    }

    function goToToday() {
      currentMonth.value = startOfMonth(today);
      selectedDate.value = formatDateKey(today);
      expandedYears.value = new Set([today.getFullYear()]);
    }

    function toggleYear(year) {
      const next = new Set(expandedYears.value);
      if (next.has(year)) {
        next.delete(year);
      } else {
        next.add(year);
      }
      expandedYears.value = next;
    }

    async function toggleTask(taskId) {
      if (isLocked.value) return;
      try {
        const response = await fetch(`/api/tasks/${taskId}/toggle`, { method: "POST" });
        if (!response.ok) {
          throw new Error(`Failed to toggle task: ${response.status}`);
        }
        const updated = await response.json();
        const entry = dayMap.value[updated.date];
        if (!entry) return;
        const nextTasks = entry.tasks.map((task) =>
          task.id === updated.id ? updated : task
        );
        entry.tasks = nextTasks;
        entry.status = getDayStatus(nextTasks);
      } catch (err) {
        error.value = err.message || "Failed to toggle task";
      }
    }

    function startOfToday() {
      return new Date(today.getFullYear(), today.getMonth(), today.getDate());
    }

    const selectedTasks = computed(() => tasksByDate.value[selectedDate.value] || []);

    const selectedDayStatus = computed(() => {
      const entry = dayMap.value[selectedDate.value];
      if (entry?.status) return normalizeStatus(entry.status);
      return getDayStatus(selectedTasks.value);
    });

    const selectedDateLabel = computed(() => {
      const date = new Date(selectedDate.value);
      return `${date.getDate()} ${monthNames[date.getMonth()]}`;
    });

    const isLocked = computed(() => new Date(selectedDate.value) < startOfToday());

    watch(currentMonth, (next) => {
      loadMonth(next);
    });

    onMounted(() => {
      loadMonth(currentMonth.value);
    });

    return {
      monthNames,
      calendarDays,
      monthStats,
      yearTree,
      selectedTasks,
      selectedDayStatus,
      selectedDate,
      selectedDateLabel,
      isLocked,
      loading,
      error,
      selectDay,
      setMonth,
      goToToday,
      toggleTask,
      toggleYear,
      expandedYears,
      currentMonth,
      today,
    };
  },
  template: `
    <div class="app-shell">
      <aside class="panel">
        <div class="panel-inner">
          <div class="logo">
            <div class="dot"></div>
            <div>30 Days Tracker</div>
          </div>

          <div class="section-title">Navigation</div>
          <div class="shortcut-row">
            <button class="button" @click="goToToday">Today</button>
            <button class="button" @click="setMonth(today.getMonth())">Current Month</button>
          </div>

          <div class="section-title">Months</div>
          <div class="month-tree">
            <div
              v-for="group in yearTree"
              :key="group.year"
              class="year-node"
            >
              <div class="year-header" @click="toggleYear(group.year)">
                <span>{{ group.year }}</span>
                <span v-if="expandedYears.has(group.year)">▼</span>
                <span v-else>▲</span>
              </div>
              <div v-if="expandedYears.has(group.year)" class="year-months">
                <div
                  v-for="month in group.months"
                  :key="month.key"
                  class="month-card"
                  :class="{ active: month.index === currentMonth.getMonth() }"
                  @click="setMonth(month.index)"
                >
                  <div class="month-title">
                    <span>{{ month.name }}</span>
                    <span class="month-pill">Month</span>
                  </div>
                  <div class="legend">
                    <div class="legend-item">
                      <span class="badge success"></span>
                      <span>Done</span>
                    </div>
                    <div class="legend-item">
                      <span class="badge warning"></span>
                      <span>Partial</span>
                    </div>
                    <div class="legend-item">
                      <span class="badge danger"></span>
                      <span>Missed</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main class="panel">
        <div class="panel-inner">
          <div class="calendar-header">
            <div>
              <div class="section-title">Calendar</div>
              <div class="calendar-title">{{ monthNames[currentMonth.getMonth()] }} {{ currentMonth.getFullYear() }}</div>
            </div>
            <div class="legend">
              <div class="legend-item">
                <span class="badge success"></span>
                <span>All done</span>
              </div>
              <div class="legend-item">
                <span class="badge warning"></span>
                <span>Partial</span>
              </div>
              <div class="legend-item">
                <span class="badge danger"></span>
                <span>Missed</span>
              </div>
            </div>
          </div>

          <div class="calendar-grid">
            <div class="day-name" v-for="name in ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']" :key="name">
              {{ name }}
            </div>
            <div
              v-for="day in calendarDays"
              :key="day.date ? day.date : 'pad-' + Math.random()"
              class="day-cell"
                :class="[day.date ? 'status-' + day.status : '', { inactive: !day.date }]"
              @click="selectDay(day)
              "
            >
              <div class="day-number">{{ day.label }}</div>
            </div>
          </div>

          <div class="section-title" style="margin-top: 18px">
            Tasks for {{ selectedDateLabel }}
          </div>
          <div class="task-list" :class="{ locked: isLocked }">
            <div v-if="loading" class="task-row">
              <div class="meta">Loading tasks...</div>
            </div>
            <div v-if="error && !loading" class="task-row">
              <div class="meta">{{ error }}</div>
            </div>
            <div v-if="!selectedTasks.length && !loading && !error" class="task-row">
              <div class="meta">No tasks logged for this day.</div>
            </div>
            <div v-for="task in selectedTasks" :key="task.id" class="task-row">
              <label class="checkbox">
                <input
                  type="checkbox"
                  :checked="task.completed"
                  :disabled="isLocked"
                  @change="toggleTask(task.id)"
                />
                <span></span>
              </label>
              <div>
                <div class="title">{{ task.title }}</div>
                <div class="meta">{{ task.notes }}</div>
              </div>
              <div class="meta" style="margin-left:auto">{{ isLocked ? 'Locked' : 'Live' }}</div>
            </div>
          </div>
        </div>
      </main>

      <section class="panel">
        <div class="panel-inner">
          <div class="section-title">Day focus</div>
          <div class="calendar-title" style="margin-bottom: 10px;">
            {{ selectedDateLabel }}
          </div>
          <div class="legend" style="margin-bottom: 14px;">
            <span class="badge" :class="{
              success: selectedDayStatus === 'success',
              warning: selectedDayStatus === 'warning',
              danger: selectedDayStatus === 'danger'
            }"></span>
            <span>
              Status: <strong>{{ selectedDayStatus === 'success' ? 'All done' : selectedDayStatus === 'warning' ? 'Partial' : 'Missed' }}</strong>
            </span>
          </div>

          <div class="section-title">Stats (current month)</div>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-label">Done</div>
              <div class="stat-value">{{ monthStats.success }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Partial</div>
              <div class="stat-value">{{ monthStats.warning }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Missed</div>
              <div class="stat-value">{{ monthStats.danger }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Longest streak</div>
              <div class="stat-value">{{ monthStats.longestStreak }} days</div>
              <div class="streak-row">
                <span class="badge success"></span>
                <span>Calculated on fully completed days</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  `,
}).mount("#app");
