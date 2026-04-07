// api/marquer-lu.js — PATCH /api/marquer-lu  (messages)
'use strict';
const { supabase, json, cors, checkAdmin } = require('./_shared');

module.exports = async function(req, res) {
  if (req.method === 'OPTIONS') return cors(res);
  if (req.method !== 'PATCH')   return json(res, { error: 'Méthode non autorisée' }, 405);
  if (!checkAdmin(req))         return json(res, { error: 'Non autorisé' }, 401);
  const { id } = req.body || {};
  if (!id) return json(res, { error: 'ID manquant' }, 400);
  const { error } = await supabase.from('messages').update({ lu: true }).eq('id', id);
  if (error) return json(res, { error: error.message }, 500);
  return json(res, { success: true });
};
