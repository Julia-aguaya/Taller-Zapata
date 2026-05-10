export const LEGAL_STATES = {
  SIN_INFO: 'sin_info',
  EN_CURSO: 'en_curso',
  RESUELTO: 'resuelto',
  APELACION: 'apelacion',
};

export function parseLegalInfo(caseData) {
  if (!caseData) return null;
  
  return {
    caseNumber: caseData.numero_expediente || caseData.caseNumber,
    court: caseData.juzgado || caseData.court,
    judge: caseData.juez || caseData.judge,
    state: parseLegalState(caseData.estado_legal || caseData.legalState),
    startDate: caseData.fecha_inicio || caseData.startDate,
    endDate: caseData.fecha_fin || caseData.endDate,
    expenses: parseLegalExpenses(caseData.gastos_legales || caseData.legalExpenses),
    news: parseLegalNews(caseData.noticias || caseData.news),
  };
}

function parseLegalState(state) {
  if (!state) return LEGAL_STATES.SIN_INFO;
  
  const normalized = String(state).toLowerCase().trim();
  
  if (normalized === 'en curso' || normalized === 'en_curso' || normalized === 'en_proceso' || normalized === 'in_progress') {
    return LEGAL_STATES.EN_CURSO;
  }
  if (normalized === 'resuelto' || normalized === 'completed' || normalized === 'finished') {
    return LEGAL_STATES.RESUELTO;
  }
  if (normalized === 'apelacion' || normalized === 'apelación' || normalized === 'appeal') {
    return LEGAL_STATES.APELACION;
  }
  return LEGAL_STATES.SIN_INFO;
}

export function parseLegalExpenses(expensesData) {
  if (!expensesData) return { total: 0, items: [] };
  
  if (typeof expensesData === 'number') {
    return { total: expensesData, items: [] };
  }
  
  if (Array.isArray(expensesData)) {
    const items = expensesData.map(parseExpenseItem);
    const total = items.reduce((sum, item) => sum + (item.amount || 0), 0);
    return { total, items };
  }
  
  return {
    total: expensesData.total || 0,
    items: Array.isArray(expensesData.items) ? expensesData.items.map(parseExpenseItem) : [],
  };
}

function parseExpenseItem(item) {
  if (!item) return { description: '', amount: 0, date: null };
  
  return {
    description: item.descripcion || item.description || '',
    amount: parseAmount(item.monto || item.amount),
    date: item.fecha || item.date || null,
    category: item.categoria || item.category || 'general',
  };
}

function parseAmount(amount) {
  if (!amount) return 0;
  if (typeof amount === 'number') return amount;
  const parsed = parseFloat(String(amount).replace(/[^0-9.-]/g, ''));
  return isNaN(parsed) ? 0 : parsed;
}

export function parseLegalNews(newsData) {
  if (!newsData) return [];
  if (!Array.isArray(newsData)) return [];
  
  return newsData.map(news => ({
    id: news.id || news.noticia_id,
    title: news.titulo || news.title,
    date: news.fecha || news.date,
    summary: news.resumen || news.summary,
    source: news.fuente || news.source,
  }));
}

export function getLegalStateLabel(state) {
  const labels = {
    [LEGAL_STATES.SIN_INFO]: 'Sin Información',
    [LEGAL_STATES.EN_CURSO]: 'En Curso',
    [LEGAL_STATES.RESUELTO]: 'Resuelto',
    [LEGAL_STATES.APELACION]: 'En Apelación',
  };
  return labels[state] || state;
}

export function calculateTotalLegalExpenses(expenses) {
  if (!expenses) return 0;
  
  if (typeof expenses === 'number') return expenses;
  
  if (expenses.total !== undefined) return expenses.total;
  
  if (Array.isArray(expenses)) {
    return expenses.reduce((sum, item) => sum + parseAmount(item.amount || item.monto), 0);
  }
  
  return 0;
}