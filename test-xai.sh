export XAI_KEY="xair_sk_test_R3sgmQdxIwhswrN7Wy7cE8o9DxnhKYlN3iy6x1_ZYrk"
for i in {1..11}
do
  echo "Request $i"

  curl -s -X POST http://localhost:3001/wh/v2/call \
    -H "Content-Type: application/json" \
    -d "{
      \"_v\": 2,
      \"_id\": \"test-$i\",
      \"_kind\": \"REQ\",
      \"_ts\": $(date +%s000),
      \"_payload\": {
        \"_module\": \"xai-router\",
        \"_op\": \"generate\",
        \"_params\": {
          \"_api_key\": \"$XAI_KEY\",
          \"_prompt\": \"Say hello.\"
        }
      }
    }"

  echo ""
done