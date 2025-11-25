#!/bin/sh

if [ ! -f "/data/drasi-cluster-created.flag" ]; then
    k3d cluster delete drasi-grafana || true
    k3d cluster create drasi-grafana --no-lb --agents 0
    sed -i.bak 's/127\.0\.0\.1/host.docker.internal/g' ~/.kube/config
    touch "/data/drasi-cluster-created.flag"
fi

while ! kubectl cluster-info; do
  echo "Waiting for cluster to be ready..."
  sleep 2
done

kubectl apply -f drasi-postgres.yaml

if [ ! -f "/data/drasi-init.flag" ]; then
    drasi env kube
    drasi init
    drasi apply -f hello-world-source.yaml
    drasi wait source hello-world -t 120
    drasi apply -f hello-world-queries.yaml
    drasi apply -f hello-world-reaction.yaml
    drasi wait reaction hello-world-signalr -t 120
    touch "/data/drasi-init.flag"
fi

kubectl port-forward svc/postgres 5432:5432 &
/update-data.sh & 
kubectl port-forward --address 0.0.0.0 services/hello-world-signalr-reaction-gateway 8080:8080 -n drasi-system
wait