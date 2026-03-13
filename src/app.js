// ============ DATA ============
const COLUMNS = [
  { id:'todo',     label:'To Do',       icon:'fa-clipboard-list', color:'amber',   gradient:'from-amber-400 to-orange-400' },
  { id:'progress', label:'In Progress', icon:'fa-spinner',        color:'blue',    gradient:'from-blue-400 to-cyan-400' },
  { id:'review',   label:'Review',      icon:'fa-eye',            color:'violet',  gradient:'from-violet-400 to-purple-400' },
  { id:'done',     label:'Done',        icon:'fa-check-circle',   color:'emerald', gradient:'from-emerald-400 to-teal-400' }
];

const TAG_COLORS = {
  frontend:  { bg:'bg-blue-50',    text:'text-blue-600',    border:'border-blue-200' },
  backend:   { bg:'bg-emerald-50', text:'text-emerald-600', border:'border-emerald-200' },
  design:    { bg:'bg-pink-50',    text:'text-pink-600',    border:'border-pink-200' },
  marketing: { bg:'bg-violet-50',  text:'text-violet-600',  border:'border-violet-200' },
  bug:       { bg:'bg-red-50',     text:'text-red-600',     border:'border-red-200' },
  feature:   { bg:'bg-amber-50',   text:'text-amber-600',   border:'border-amber-200' }
};

const PRIORITY_COLORS = {
  low:    { dot:'bg-emerald-400', bg:'bg-emerald-50', text:'text-emerald-700', label:'Low' },
  medium: { dot:'bg-amber-400',   bg:'bg-amber-50',   text:'text-amber-700',   label:'Medium' },
  high:   { dot:'bg-red-400',     bg:'bg-red-50',     text:'text-red-700',     label:'High' }
};

const ASSIGNEE_COLORS = { Alex:'from-brand-400 to-purple-500', Sam:'from-emerald-400 to-teal-500', Jordan:'from-amber-400 to-orange-500' };

let tasks = [
  { id:1, title:'Design landing page hero', desc:'Create a high-impact hero section with gradient background and clear CTA.', status:'todo', priority:'high', due:'2026-03-18', tag:'design', assignee:'Alex' },
  { id:2, title:'Setup CI/CD pipeline', desc:'Configure GitHub Actions for automated tests and deployment.', status:'todo', priority:'medium', due:'2026-03-20', tag:'backend', assignee:'Sam' },
  { id:3, title:'Implement auth flow', desc:'Add OAuth2 with Google and email/password login.', status:'progress', priority:'high', due:'2026-03-15', tag:'backend', assignee:'Sam' },
  { id:4, title:'Build notification system', desc:'Real-time push notifications with WebSocket.', status:'progress', priority:'medium', due:'2026-03-22', tag:'feature', assignee:'Jordan' },
  { id:5, title:'Review brand guidelines', desc:'Ensure all components align with updated brand palette.', status:'review', priority:'low', due:'2026-03-25', tag:'design', assignee:'Alex' },
  { id:6, title:'Fix mobile nav bug', desc:'Hamburger menu not closing after route change.', status:'review', priority:'high', due:'2026-03-14', tag:'bug', assignee:'Jordan' },
  { id:7, title:'Write API documentation', desc:'Document all REST endpoints with example payloads.', status:'done', priority:'low', due:'2026-03-10', tag:'backend', assignee:'Sam' },
  { id:8, title:'Launch email campaign', desc:'Send intro email to beta users.', status:'done', priority:'medium', due:'2026-03-08', tag:'marketing', assignee:'Alex' }
];

let nextId = 9;
let deleteTargetId = null;
let draggedCard = null;
let searchQuery = '';

// ============ RENDER ============
function render() {
  const board = document.getElementById('kanban');
  board.innerHTML = '';

  COLUMNS.forEach((col, ci) => {
    const colTasks = tasks.filter(t => t.status === col.id && matchesSearch(t));
    // Update count badges
    const countEl = document.getElementById(col.id === 'progress' ? 'progressCount' : col.id + 'Count');
    if (countEl) { countEl.textContent = colTasks.length; countEl.classList.add('badge-bounce'); setTimeout(() => countEl.classList.remove('badge-bounce'), 400); }

    const column = document.createElement('div');
    column.className = `kanban-col flex-1 min-w-[280px] max-w-[380px] flex flex-col bg-white/50 border border-slate-200/70 rounded-2xl animate-slideUp`;
    column.style.animationDelay = `${ci * 0.07}s`;
    column.dataset.status = col.id;

    // Column header
    column.innerHTML = `
      <div class="sticky top-0 z-10 bg-white/80 backdrop-blur-md rounded-t-2xl px-4 pt-4 pb-3 border-b border-slate-100">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-linear-to-br ${col.gradient} flex items-center justify-center shadow-md shadow-${col.color}-400/20">
              <i class="fas ${col.icon} text-white text-xs"></i>
            </div>
            <h3 class="text-sm font-bold text-slate-700">${col.label}</h3>
            <span class="text-xs font-bold text-slate-400 bg-slate-100 rounded-md px-1.5 py-0.5">${colTasks.length}</span>
          </div>
          <button onclick="openModalForColumn('${col.id}')" class="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center transition text-slate-400 hover:text-brand-500">
            <i class="fas fa-plus text-xs"></i>
          </button>
        </div>
      </div>
      <div class="flex-1 p-3 space-y-3 col-scroll overflow-y-auto max-h-[calc(100vh-260px)]" id="col-${col.id}"
           ondragover="handleDragOver(event)" ondragleave="handleDragLeave(event)" ondrop="handleDrop(event, '${col.id}')">
        ${colTasks.length === 0 ? `<div class="flex flex-col items-center justify-center py-8 text-slate-300"><i class="fas fa-inbox text-3xl mb-2"></i><p class="text-xs font-medium">No tasks</p></div>` : ''}
      </div>
    `;

    board.appendChild(column);

    // Insert task cards
    const container = column.querySelector(`#col-${col.id}`);
    colTasks.forEach((task, ti) => {
      container.insertBefore(createCard(task, ti), container.querySelector('.flex.flex-col'));
    });
  });
}

function matchesSearch(task) {
  if (!searchQuery) return true;
  const q = searchQuery.toLowerCase();
  return task.title.toLowerCase().includes(q) || task.desc.toLowerCase().includes(q) || (task.tag && task.tag.toLowerCase().includes(q));
}

function createCard(task, index) {
  const p = PRIORITY_COLORS[task.priority];
  const card = document.createElement('div');
  card.className = `task-card bg-white rounded-xl border border-slate-200/80 p-4 cursor-grab active:cursor-grabbing animate-popIn priority-${task.priority}`;
  card.style.animationDelay = `${index * 0.05}s`;
  card.draggable = true;
  card.dataset.id = task.id;

  card.addEventListener('dragstart', handleDragStart);
  card.addEventListener('dragend', handleDragEnd);

  const dueStr = task.due ? formatDate(task.due) : '';
  const overdue = task.due && new Date(task.due) < new Date() && task.status !== 'done';
  const tagHtml = task.tag ? `<span class="tag-pill ${TAG_COLORS[task.tag].bg} ${TAG_COLORS[task.tag].text} border ${TAG_COLORS[task.tag].border}">${task.tag}</span>` : '';
  const assigneeInitial = task.assignee ? task.assignee[0] : '?';
  const assigneeGrad = ASSIGNEE_COLORS[task.assignee] || 'from-slate-400 to-slate-500';

  card.innerHTML = `
    <div class="flex items-start justify-between gap-2 mb-2.5">
      <div class="flex items-center gap-2 flex-wrap">
        ${tagHtml}
        <span class="tag-pill ${p.bg} ${p.text} flex items-center gap-1">
          <span class="pri-dot w-1.5 h-1.5 rounded-full ${p.dot}"></span> ${p.label}
        </span>
      </div>
      <div class="flex items-center gap-1 shrink-0">
        <button onclick="editTask(${task.id})" class="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center transition text-slate-400 hover:text-brand-500"><i class="fas fa-pen text-[0.65rem]"></i></button>
        <button onclick="deleteTask(${task.id})" class="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center transition text-slate-400 hover:text-red-500"><i class="fas fa-trash text-[0.65rem]"></i></button>
      </div>
    </div>
    <h4 class="text-sm font-semibold text-slate-800 leading-snug mb-1 ${task.status === 'done' ? 'line-through text-slate-400' : ''}">${escapeHtml(task.title)}</h4>
    ${task.desc ? `<p class="text-xs text-slate-500 leading-relaxed mb-3 line-clamp-2">${escapeHtml(task.desc)}</p>` : '<div class="mb-2"></div>'}
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-1.5 text-xs ${overdue ? 'text-red-500 font-semibold' : 'text-slate-400'}">
        ${dueStr ? `<i class="far fa-calendar-alt"></i> ${dueStr} ${overdue ? '<i class="fas fa-exclamation-circle ml-0.5"></i>' : ''}` : ''}
      </div>
      <div class="w-6 h-6 rounded-full bg-linear-to-br ${assigneeGrad} flex items-center justify-center text-white text-[0.55rem] font-bold shadow-sm" title="${task.assignee}">${assigneeInitial}</div>
    </div>
  `;
  return card;
}

// ============ DRAG & DROP ============
function handleDragStart(e) {
  draggedCard = this;
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', this.dataset.id);
}
function handleDragEnd() { this.classList.remove('dragging'); draggedCard = null; document.querySelectorAll('.drop-target').forEach(el => el.classList.remove('drop-target')); }
function handleDragOver(e) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; e.currentTarget.closest('.kanban-col').classList.add('drop-target'); }
function handleDragLeave(e) { e.currentTarget.closest('.kanban-col').classList.remove('drop-target'); }
function handleDrop(e, status) {
  e.preventDefault();
  const id = parseInt(e.dataTransfer.getData('text/plain'));
  const task = tasks.find(t => t.id === id);
  if (task) { task.status = status; render(); }
  document.querySelectorAll('.drop-target').forEach(el => el.classList.remove('drop-target'));
}

// ============ MODAL ============
function openModal() {
  document.getElementById('taskForm').reset();
  document.getElementById('taskId').value = '';
  document.getElementById('modalTitle').textContent = 'New Task';
  document.getElementById('modalSubmit').textContent = 'Create Task';
  document.querySelector('input[name="assignee"][value="Alex"]').checked = true;
  showModal('taskModal');
}

function openModalForColumn(status) {
  openModal();
  document.getElementById('taskStatus').value = status;
}

function editTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  document.getElementById('taskId').value = task.id;
  document.getElementById('taskTitle').value = task.title;
  document.getElementById('taskDesc').value = task.desc;
  document.getElementById('taskStatus').value = task.status;
  document.getElementById('taskPriority').value = task.priority;
  document.getElementById('taskDue').value = task.due || '';
  document.getElementById('taskTag').value = task.tag || '';
  const radio = document.querySelector(`input[name="assignee"][value="${task.assignee}"]`);
  if (radio) radio.checked = true;
  document.getElementById('modalTitle').textContent = 'Edit Task';
  document.getElementById('modalSubmit').textContent = 'Save Changes';
  showModal('taskModal');
}

function saveTask(e) {
  e.preventDefault();
  const id = document.getElementById('taskId').value;
  const data = {
    title: document.getElementById('taskTitle').value.trim(),
    desc: document.getElementById('taskDesc').value.trim(),
    status: document.getElementById('taskStatus').value,
    priority: document.getElementById('taskPriority').value,
    due: document.getElementById('taskDue').value,
    tag: document.getElementById('taskTag').value,
    assignee: document.querySelector('input[name="assignee"]:checked')?.value || 'Alex'
  };

  if (id) {
    const task = tasks.find(t => t.id === parseInt(id));
    if (task) Object.assign(task, data);
  } else {
    tasks.push({ id: nextId++, ...data });
  }

  closeModal();
  render();
}

function deleteTask(id) { deleteTargetId = id; showModal('deleteModal'); }
function confirmDelete() { tasks = tasks.filter(t => t.id !== deleteTargetId); closeDeleteModal(); render(); }

function showModal(id) {
  const modal = document.getElementById(id);
  modal.classList.remove('hidden');
  requestAnimationFrame(() => {
    modal.querySelector('.modal-overlay').classList.remove('opacity-0');
    const c = modal.querySelector('.modal-content');
    c.classList.remove('opacity-0','translate-y-4','scale-[0.97]');
  });
}

function closeModal() { hideModal('taskModal'); }
function closeDeleteModal() { hideModal('deleteModal'); deleteTargetId = null; }

function hideModal(id) {
  const modal = document.getElementById(id);
  modal.querySelector('.modal-overlay').classList.add('opacity-0');
  const c = modal.querySelector('.modal-content');
  c.classList.add('opacity-0','translate-y-4','scale-[0.97]');
  setTimeout(() => modal.classList.add('hidden'), 250);
}

// ============ SIDEBAR ============
function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  const ov = document.getElementById('sidebarOverlay');
  sb.classList.toggle('-translate-x-full');
  ov.classList.toggle('hidden');
}

// ============ SEARCH ============
function filterTasks() {
  searchQuery = document.getElementById('searchInput').value;
  render();
}

// ============ UTILS ============
function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[d.getMonth()]} ${d.getDate()}`;
}
function escapeHtml(str) {
  const div = document.createElement('div'); div.textContent = str; return div.innerHTML;
}

// ============ KEYBOARD ============
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { closeModal(); closeDeleteModal(); }
});

// ============ INIT ============
render();