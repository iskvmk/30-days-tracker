const { createApp, computed, ref } = Vue;

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

function buildRecurringTasks(baseTasks, targetMonth) {
  const items = [];
  baseTasks.forEach((task) => {
    if (task.recurring === "daily") {
      const lastDay = endOfMonth(targetMonth).getDate();
      for (let d = 1; d <= lastDay; d++) {
        const date = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), d);
        items.push({ ...task, date: formatDateKey(date) });
      }
    } else {
      items.push(task);
    }
  });
  return items;
}

const today = new Date();
const initialMonth = startOfMonth(today);

const sampleBaseTasks = [
  {
    id: "t1",
    title: "Morning planning",
    completed: true,
    recurring: "daily",
    notes: "5-minute schedule check",
    date: formatDateKey(today),
  },
  {
    id: "t2",
    title: "Code for 2 hours",
    completed: false,
    recurring: "daily",
    notes: "Feature work",
    date: formatDateKey(today),
  },
  {
    id: "t3",
    title: "Workout",
    completed: true,
    recurring: null,
    notes: "Strength training",
    date: formatDateKey(today),
  },
  {
    id: "t4",
    title: "Write a recap",
    completed: false,
    recurring: null,
    notes: "End-of-day reflection",
    date: formatDateKey(today),
  },
];

const sampleMonthTasks = buildRecurringTasks(sampleBaseTasks, initialMonth);

createApp({
  setup() {
    const currentMonth = ref(startOfMonth(initialMonth));
    const selectedDate = ref(formatDateKey(today));
    const tasks = ref(sampleMonthTasks);
    const expandedYears = ref(new Set([today.getFullYear()]));

    const tasksByDate = computed(() => {
      return tasks.value.reduce((acc, task) => {
        acc[task.date] = acc[task.date] || [];
        acc[task.date].push(task);
        return acc;
      }, {});
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
        const dayTasks = tasksByDate.value[dateKey] || [];
        days.push({
          label: day,
          date: dateKey,
          tasks: dayTasks,
          status: getDayStatus(dayTasks),
        });
      }
      return days;
    });

    const monthStats = computed(() => {
      const stats = { success: 0, warning: 0, danger: 0 };
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
      const tentativeDate = new Date(currentMonth.value.getFullYear(), index, today.getDate());
      selectedDate.value = formatDateKey(tentativeDate);
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

    function toggleTask(taskId) {
      const updated = tasks.value.map((task) => {
        if (task.id !== taskId) return task;
        if (new Date(task.date) < startOfToday()) {
          return task; // locked
        }
        return { ...task, completed: !task.completed };
      });
      tasks.value = updated;
    }

    function startOfToday() {
      return new Date(today.getFullYear(), today.getMonth(), today.getDate());
    }

    const selectedTasks = computed(() => tasksByDate.value[selectedDate.value] || []);

    const selectedDayStatus = computed(() => getDayStatus(selectedTasks.value));

    const selectedDateLabel = computed(() => {
      const date = new Date(selectedDate.value);
      return `${date.getDate()} ${monthNames[date.getMonth()]}`;
    });

    const isLocked = computed(() => new Date(selectedDate.value) < startOfToday());

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
              :class="{ inactive: !day.date }"
              @click="selectDay(day)
              "
            >
              <div class="day-number">{{ day.label }}</div>
              <div v-if="day.date" class="status-dot" :class="{
                'status-success': day.status === 'success',
                'status-warning': day.status === 'warning',
                'status-danger': day.status === 'danger'
              }"></div>
              <div v-if="day.tasks && day.tasks.length" class="task-list">
                <div class="task-row" v-for="task in day.tasks.slice(0, 2)" :key="task.id">
                  <label class="checkbox">
                    <input type="checkbox" :checked="task.completed" disabled />
                    <span></span>
                  </label>
                  <div>
                    <div class="title">{{ task.title }}</div>
                    <div class="meta">{{ task.notes }}</div>
                  </div>
                </div>
                <div v-if="day.tasks.length > 2" class="meta">+{{ day.tasks.length - 2 }} more</div>
              </div>
            </div>
          </div>

          <div class="section-title" style="margin-top: 18px">Today's tasks</div>
          <div class="task-list" :class="{ locked: isLocked }">
            <div v-if="!selectedTasks.length" class="task-row">
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
