/**
 * Sanitized NMI contract fixtures for tests. Every value here is synthetic
 * — no real merchant IDs, security keys, card numbers, or customer data.
 * Shapes mirror NMI's actual `transact.php` (form-encoded) and `query.php`
 * (XML) response formats so parsing tests exercise the real wire format.
 */

export const SALE_APPROVED =
  'response=1&responsetext=SUCCESS&authcode=123456&transactionid=3987654321&' +
  'avsresponse=&cvvresponse=M&orderid=ord_test-attempt-1&type=sale&response_code=100';

export const SALE_DECLINED =
  'response=2&responsetext=DECLINE&authcode=&transactionid=3987654322&' +
  'avsresponse=&cvvresponse=N&orderid=ord_test-attempt-1&type=sale&response_code=200';

export const SALE_ERROR =
  'response=3&responsetext=Invalid+Payment+Token&authcode=&transactionid=&' +
  'avsresponse=&cvvresponse=&orderid=ord_test-attempt-1&type=sale&response_code=300';

export const QUERY_FOUND_COMPLETE = `<?xml version="1.0" encoding="UTF-8"?>
<nm_response>
  <transaction>
    <transaction_id>3987654321</transaction_id>
    <condition>complete</condition>
    <order_id>ord_test-attempt-1</order_id>
    <response_code>100</response_code>
  </transaction>
</nm_response>`;

export const QUERY_FOUND_FAILED = `<?xml version="1.0" encoding="UTF-8"?>
<nm_response>
  <transaction>
    <transaction_id>3987654322</transaction_id>
    <condition>failed</condition>
    <order_id>ord_test-attempt-1</order_id>
    <response_code>200</response_code>
  </transaction>
</nm_response>`;

export const QUERY_NOT_FOUND = `<?xml version="1.0" encoding="UTF-8"?>
<nm_response>
</nm_response>`;
