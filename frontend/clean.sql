DELETE FROM "TelemetryLog" WHERE message NOT LIKE '%[HIST]%' AND message NOT LIKE '%Launched application%';
