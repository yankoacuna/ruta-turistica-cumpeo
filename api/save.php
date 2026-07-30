<?php
/**
 * api/save.php — Cumpeo Turismo Backend
 * API mínima para guardar/actualizar archivos JSON desde el panel admin.
 * 
 * SEGURIDAD: Protegido por token simple. Cambiar antes de producción.
 */

// ── Configuración de seguridad ─────────────────────────────
define('ADMIN_TOKEN', 'cumpeo2024'); // CAMBIAR EN PRODUCCIÓN
define('DATA_DIR', __DIR__ . '/../data/');
define('ALLOWED_TYPES', ['destinations', 'restaurants', 'accommodations', 'config']);

// ── CORS y Headers ─────────────────────────────────────────
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ── Solo POST ──────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
    exit;
}

// ── Leer body JSON ─────────────────────────────────────────
$raw = file_get_contents('php://input');
$body = json_decode($raw, true);

if (!$body) {
    http_response_code(400);
    echo json_encode(['error' => 'JSON inválido']);
    exit;
}

// ── Verificar token ────────────────────────────────────────
$token = $body['token'] ?? '';
if ($token !== ADMIN_TOKEN) {
    http_response_code(403);
    echo json_encode(['error' => 'Token inválido']);
    exit;
}

// ── Verificar tipo ─────────────────────────────────────────
$type = $body['type'] ?? '';
if (!in_array($type, ALLOWED_TYPES)) {
    http_response_code(400);
    echo json_encode(['error' => 'Tipo de datos no permitido: ' . $type]);
    exit;
}

// ── Verificar datos ────────────────────────────────────────
$data = $body['data'] ?? null;
if (!$data) {
    http_response_code(400);
    echo json_encode(['error' => 'Sin datos para guardar']);
    exit;
}

// ── Mapear tipo → archivo ──────────────────────────────────
$fileMap = [
    'destinations'  => 'destinations.json',
    'restaurants'   => 'restaurants.json',
    'accommodations'=> 'accommodations.json',
    'config'        => 'config.json',
];

$filename = $fileMap[$type];
$filepath = DATA_DIR . $filename;

// ── Backup del archivo anterior ────────────────────────────
if (file_exists($filepath)) {
    $backupDir = DATA_DIR . 'backups/';
    if (!is_dir($backupDir)) {
        mkdir($backupDir, 0755, true);
    }
    $backupName = $backupDir . basename($filename, '.json') . '_' . date('Y-m-d_His') . '.json';
    copy($filepath, $backupName);
    
    // Mantener solo los últimos 5 backups de cada archivo
    $backups = glob($backupDir . basename($filename, '.json') . '_*.json');
    if (count($backups) > 5) {
        sort($backups);
        $toDelete = array_slice($backups, 0, count($backups) - 5);
        foreach ($toDelete as $b) @unlink($b);
    }
}

// ── Agregar metadata de actualización ─────────────────────
$data['version']     = isset($data['version']) ? $data['version'] : '1.0';
$data['lastUpdated'] = date('Y-m-d');

// ── Guardar archivo ────────────────────────────────────────
$jsonContent = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

if ($jsonContent === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Error al codificar JSON']);
    exit;
}

$result = file_put_contents($filepath, $jsonContent, LOCK_EX);

if ($result === false) {
    http_response_code(500);
    echo json_encode(['error' => 'No se pudo escribir el archivo. Verifica permisos de escritura.']);
    exit;
}

// ── Respuesta exitosa ──────────────────────────────────────
echo json_encode([
    'success'     => true,
    'type'        => $type,
    'file'        => $filename,
    'bytes'       => $result,
    'updatedAt'   => date('c')
]);
