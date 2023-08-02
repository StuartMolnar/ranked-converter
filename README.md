# ranked-converter
 Web app to convert player ranks between Valorant and League of Legends by ranked percentile

# dev section
Using Supabase database and Azure Container App Jobs.

Create the scheduled database updating with this series of Azure CLI commands:

Create resource group
<code>az group create --name "ranked-converter-rg" --location "eastus"</code>

Create container app environment
<code>az containerapp env create --name "ranked-converter-env" --resource-group "ranked-converter-rg" --location "eastus"</code>

Create container app job for League data
<code>az containerapp job create --name "league-job" --resource-group "ranked-converter-rg" --environment "ranked-converter-env" --trigger-type "Schedule" --replica-timeout 200 --replica-retry-limit 1 --replica-completion-count 1 --parallelism 1 --image "stuartmolnar/league-rank-converter:latest" --cpu "0.25" --memory "0.5Gi" --cron-expression "0 0 * * 3" --env-vars SUPABASE_URL="https://frhaablrjokjfjszifpj.supabase.co" SUPABASE_SERVICE_KEY="service key"</code>

Create container app job for Valorant data
<code>az containerapp job create --name "valorant-job" --resource-group "ranked-converter-rg" --environment "ranked-converter-env" --trigger-type "Schedule" --replica-timeout 200 --replica-retry-limit 1 --replica-completion-count 1 --parallelism 1 --image "stuartmolnar/valorant-rank-converter:latest" --cpu "0.25" --memory "0.5Gi" --cron-expression "0 0 * * 3" --env-vars SUPABASE_URL="https://frhaablrjokjfjszifpj.supabase.co" SUPABASE_SERVICE_KEY="service key"</code>