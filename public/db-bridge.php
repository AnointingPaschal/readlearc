<?php
/**
 * Readlearc Database Bridge
 * Upload this file to your cPanel public_html or a subdirectory.
 * Vercel calls this via HTTP; this script connects to local PostgreSQL.
 * 
 * IMPORTANT: After uploading, set DB_BRIDGE_SECRET in Vercel env vars.
 * Use the same value as the $secret variable below.
 */

// ── Change this secret and set it as DB_BRIDGE_SECRET in Vercel ──
$secret = 'rl-bridge-' . md5('sloycjbn_readlearc');

// ── PostgreSQL connection (local — accessible from this server) ───
$db_host = '127.0.0.200';
$db_port = '5432';
$db_name = 'sloycjbn_readlearc';
$db_user = 'sloycjbn_Anointing';
$db_pass = '23rdApril1997.';

// ── CORS + JSON headers ───────────────────────────────────────────
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Bridge-Key');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

// ── Auth ──────────────────────────────────────────────────────────
$key = $_SERVER['HTTP_X_BRIDGE_KEY'] ?? $_GET['key'] ?? '';
if ($key !== $secret) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// ── Ping ──────────────────────────────────────────────────────────
if (isset($_GET['ping'])) {
    echo json_encode(['status' => 'ok', 'host' => $db_host]);
    exit;
}

// ── Connect ───────────────────────────────────────────────────────
try {
    $dsn = "pgsql:host={$db_host};port={$db_port};dbname={$db_name}";
    $pdo = new PDO($dsn, $db_user, $db_pass, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_TIMEOUT            => 10,
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'DB connect failed: ' . $e->getMessage()]);
    exit;
}

// ── Execute query ─────────────────────────────────────────────────
$body  = json_decode(file_get_contents('php://input'), true) ?? [];
$query = $body['sql']    ?? '';
$params= $body['params'] ?? [];

if (!$query) {
    http_response_code(400);
    echo json_encode(['error' => 'No SQL provided']);
    exit;
}

try {
    $stmt = $pdo->prepare($query);
    $stmt->execute($params);

    // DDL statements (CREATE, DROP, INSERT etc.)
    $verb = strtoupper(trim(explode(' ', ltrim($query))[0]));
    if (in_array($verb, ['SELECT'])) {
        $rows = $stmt->fetchAll();
        echo json_encode(['rows' => $rows, 'rowCount' => count($rows)]);
    } else {
        echo json_encode(['rows' => [], 'rowCount' => $stmt->rowCount()]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
