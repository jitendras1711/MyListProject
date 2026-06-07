$cs = 'Server=tcp:atomize-server.database.windows.net,1433;Initial Catalog=AtomizeDB;Persist Security Info=False;User ID=jitendra.sawant;Password=Pradnya@1711;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;'
$conn = New-Object System.Data.SqlClient.SqlConnection($cs)
$conn.Open()
$cmd = $conn.CreateCommand()
$cmd.CommandText = "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE='BASE TABLE' ORDER BY TABLE_NAME;"
$reader = $cmd.ExecuteReader()
while ($reader.Read()) {
    Write-Host $reader.GetString(0)
}
$reader.Close()
$cmd.CommandText = "IF OBJECT_ID(N'__EFMigrationsHistory',N'U') IS NOT NULL SELECT MigrationId, ProductVersion FROM __EFMigrationsHistory ORDER BY MigrationId;"
$reader = $cmd.ExecuteReader()
while ($reader.Read()) {
    Write-Host ('HISTORY: ' + $reader.GetString(0) + ' | ' + $reader.GetString(1))
}
$reader.Close()
$conn.Close()
