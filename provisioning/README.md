# Provisioned Test Environment

Running the docker compose file in the root on the repo will spin up a Grafana container (drasi-grafana-plugin-test) and a Drasi container (drasi-grafana-plugin-host). It will take several minutes for the Drasi container to fully initialize before the Test dashboard can be viewed.

Once it is up, you should see update logs every 15 seconds:

```
Running UPDATE at.........
```

These updates will also reflect as live changes on the Test dashboard, the script issues updates against a PostgreSQL table every 15 seconds, which then flows through the continuous queries, through the SignalR endpoint and to the dashboard.

The three queries used in the test dashboard are taken directly from our [Getting starting tutorial](https://drasi.io/getting-started/).