<?php
// ══════════════════════════════════════════════════
//  M.A.C JAMAIS ASSEZ — api/config.php
//  Configuration base de données MySQL
//  !! Remplacez les valeurs avec vos infos Infinite Free !!
// ══════════════════════════════════════════════════

define('DB_HOST', 'sql200.infinityfree.com');   // votre host MySQL (voir panel Infinite Free)
define('DB_NAME', 'if0_41421476_mat');           // votre nom de base
define('DB_USER', 'if0_41421476');               // votre username MySQL
define('DB_PASS', 'VOTRE_MOT_DE_PASSE');         // votre mot de passe MySQL
define('DB_CHARSET', 'utf8mb4');

// Clé secrète admin — doit correspondre à ce que vous entrez dans l'admin
define('ADMIN_SECRET', 'mac2025!');

// ── Connexion PDO ──
function getDB(): PDO {
  static $pdo = null;
  if ($pdo) return $pdo;

  $dsn = sprintf('mysql:host=%s;dbname=%s;charset=%s', DB_HOST, DB_NAME, DB_CHARSET);
  $pdo = new PDO($dsn, DB_USER, DB_PASS, [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
  ]);
  return $pdo;
}

// ── Headers CORS & JSON ──
function sendHeaders(): void {
  header('Content-Type: application/json; charset=utf-8');
  header('Access-Control-Allow-Origin: *');
  header('Access-Control-Allow-Methods: GET, POST, PATCH, OPTIONS');
  header('Access-Control-Allow-Headers: Content-Type, X-Admin-Token');
  if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
  }
}

// ── Réponse JSON ──
function jsonResponse(array $data, int $status = 200): void {
  http_response_code($status);
  echo json_encode($data, JSON_UNESCAPED_UNICODE);
  exit;
}

// ── Vérification token admin ──
function checkAdmin(): void {
  $token = $_SERVER['HTTP_X_ADMIN_TOKEN'] ?? '';
  if ($token !== ADMIN_SECRET) {
    jsonResponse(['error' => 'Non autorisé'], 401);
  }
}

// ── Sanitisation ──
function clean(string $str, int $max = 300): string {
  return mb_substr(trim(strip_tags($str)), 0, $max);
}

function isEmail(string $e): bool {
  return (bool) filter_var($e, FILTER_VALIDATE_EMAIL);
}

function isPhone(string $p): bool {
  return (bool) preg_match('/^[\d\s+\-()\x20]{7,20}$/', $p);
}
