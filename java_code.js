// java_code.js - Stores syntax-highlighted Java code segments for the Developer View IDE component

const JAVA_CODES = {
    "Payment.java": `
<span class="keyword">package</span> java_backend;

<span class="comment">/**
 * Abstract base class representing a Payment.
 * Demonstrates:
 * 1. Abstraction: Defines abstract methods that subclasses must implement.
 * 2. Encapsulation: Restricts direct access to fields using private modifiers and public getters/setters.
 */</span>
<span class="keyword">public abstract class</span> <span class="type">Payment</span> {
    <span class="comment">// Encapsulated fields (Private access modifier)</span>
    <span class="keyword">private</span> <span class="type">String</span> transactionId;
    <span class="keyword">private</span> <span class="keyword">double</span> amount;
    <span class="keyword">private</span> <span class="type">String</span> date;
    <span class="keyword">private</span> <span class="type">String</span> status;
    <span class="keyword">private</span> <span class="type">String</span> receiptNumber;
    <span class="keyword">private</span> <span class="type">String</span> referenceNumber;
    <span class="keyword">private</span> <span class="type">String</span> customerName;
    <span class="keyword">private</span> <span class="type">String</span> maskedDetails;
    <span class="keyword">private</span> <span class="type">String</span> refundStatus; // NONE, PENDING, APPROVED, REJECTED, REFUNDED

    <span class="comment">// Constructor to initialize common attributes</span>
    <span class="keyword">public</span> <span class="type">Payment</span>(<span class="type">String</span> transactionId, <span class="keyword">double</span> amount, <span class="type">String</span> date, <span class="type">String</span> customerName, <span class="type">String</span> maskedDetails) {
        <span class="keyword">this</span>.transactionId = transactionId;
        <span class="keyword">this</span>.amount = amount;
        <span class="keyword">this</span>.date = date;
        <span class="keyword">this</span>.customerName = customerName;
        <span class="keyword">this</span>.maskedDetails = maskedDetails;
        <span class="keyword">this</span>.status = <span class="string">"PENDING"</span>;
        <span class="keyword">this</span>.refundStatus = <span class="string">"NONE"</span>;
        <span class="keyword">this</span>.receiptNumber = <span class="string">"REC-"</span> + date.replace(<span class="string">"-"</span>, <span class="string">""</span>) + <span class="string">"-"</span> + (<span class="keyword">int</span>)(<span class="number">1000</span> + <span class="type">Math</span>.random() * <span class="number">9000</span>);
        <span class="keyword">this</span>.referenceNumber = <span class="type">String</span>.valueOf((<span class="keyword">long</span>)(<span class="number">100000000000L</span> + <span class="type">Math</span>.random() * <span class="number">900000000000L</span>));
    }

    <span class="comment">/**
     * Abstract method to process payment (Abstraction).
     */</span>
    <span class="keyword">public abstract boolean</span> <span class="method">processPayment</span>();

    <span class="comment">/**
     * Abstract method to refund payment (Abstraction & Polymorphism).
     */</span>
    <span class="keyword">public abstract boolean</span> <span class="method">refund</span>();

    <span class="comment">// Getters and Setters (Encapsulation)</span>
    <span class="keyword">public</span> <span class="type">String</span> <span class="method">getTransactionId</span>() { <span class="keyword">return</span> transactionId; }
    <span class="keyword">public void</span> <span class="method">setTransactionId</span>(<span class="type">String</span> id) { <span class="keyword">this</span>.transactionId = id; }
    <span class="keyword">public double</span> <span class="method">getAmount</span>() { <span class="keyword">return</span> amount; }
    <span class="keyword">public void</span> <span class="method">setAmount</span>(<span class="keyword">double</span> amount) { <span class="keyword">if</span> (amount &gt; <span class="number">0</span>) <span class="keyword">this</span>.amount = amount; }
    <span class="keyword">public</span> <span class="type">String</span> <span class="method">getStatus</span>() { <span class="keyword">return</span> status; }
    <span class="keyword">public void</span> <span class="method">setStatus</span>(<span class="type">String</span> status) { <span class="keyword">this</span>.status = status; }
    <span class="keyword">public</span> <span class="type">String</span> <span class="method">getReceiptNumber</span>() { <span class="keyword">return</span> receiptNumber; }
    <span class="keyword">public</span> <span class="type">String</span> <span class="method">getReferenceNumber</span>() { <span class="keyword">return</span> referenceNumber; }
    <span class="keyword">public</span> <span class="type">String</span> <span class="method">getCustomerName</span>() { <span class="keyword">return</span> customerName; }
    <span class="keyword">public</span> <span class="type">String</span> <span class="method">getMaskedDetails</span>() { <span class="keyword">return</span> maskedDetails; }
    public <span class="type">String</span> <span class="method">getRefundStatus</span>() { <span class="keyword">return</span> refundStatus; }
    <span class="keyword">public void</span> <span class="method">setRefundStatus</span>(<span class="type">String</span> s) { <span class="keyword">this</span>.refundStatus = s; }
}`,

    "CardPayment.java": `
<span class="keyword">package</span> java_backend;

<span class="comment">/**
 * Concrete subclass representing Card Payment.
 * Demonstrates:
 * 1. Inheritance: Extends the Payment abstract base class.
 * 2. Encapsulation: Protects sensitive attributes.
 * 3. Polymorphism: Overrides processPayment() and refund() methods.
 */</span>
<span class="keyword">public class</span> <span class="type">CardPayment</span> <span class="keyword">extends</span> <span class="type">Payment</span> {
    <span class="keyword">private</span> <span class="type">String</span> cardNumber;
    <span class="keyword">private</span> <span class="type">String</span> expiryDate;
    <span class="keyword">private</span> <span class="type">String</span> cvv;

    <span class="keyword">public</span> <span class="type">CardPayment</span>(<span class="type">String</span> transactionId, <span class="keyword">double</span> amount, <span class="type">String</span> date,
                       <span class="type">String</span> cardHolderName, <span class="type">String</span> cardNumber, <span class="type">String</span> expiryDate, <span class="type">String</span> cvv) {
        <span class="keyword">super</span>(transactionId, amount, date, cardHolderName, maskCardNumber(cardNumber));
        <span class="keyword">this</span>.cardNumber = cardNumber;
        <span class="keyword">this</span>.expiryDate = expiryDate;
        <span class="keyword">this</span>.cvv = cvv;
    }

    <span class="annotation">@Override</span>
    <span class="keyword">public boolean</span> <span class="method">processPayment</span>() {
        <span class="type">System</span>.out.println(<span class="string">"[Java] CardPayment.processPayment() called."</span>);
        <span class="type">System</span>.out.println(<span class="string">"-> Cardholder Name: "</span> + getCustomerName());
        <span class="type">System</span>.out.println(<span class="string">"-> Card Number: "</span> + getMaskedDetails());
        
        setStatus(<span class="string">"SUCCESS"</span>);
        <span class="keyword">return true</span>;
    }

    <span class="annotation">@Override</span>
    <span class="keyword">public boolean</span> <span class="method">refund</span>() {
        <span class="type">System</span>.out.println(<span class="string">"[Java] CardPayment.refund() initiated."</span>);
        <span class="type">System</span>.out.println(<span class="string">"-> Reversing charge of INR "</span> + getAmount() + <span class="string">" to Card."</span>);
        
        setRefundStatus(<span class="string">"REFUNDED"</span>);
        <span class="keyword">return true</span>;
    }

    <span class="keyword">private static</span> <span class="type">String</span> <span class="method">maskCardNumber</span>(<span class="type">String</span> number) {
        <span class="keyword">return</span> <span class="string">"**** **** **** "</span> + number.substring(number.length() - <span class="number">4</span>);
    }
}`,

    "DigitalWalletPayment.java": `
<span class="keyword">package</span> java_backend;

<span class="comment">/**
 * Concrete subclass representing Digital Wallet Payment.
 * Demonstrates:
 * 1. Inheritance: Extends the Payment abstract base class.
 * 2. Encapsulation: Protects credentials.
 * 3. Polymorphism: Overrides processPayment() and refund() methods.
 */</span>
<span class="keyword">public class</span> <span class="type">DigitalWalletPayment</span> <span class="keyword">extends</span> <span class="type">Payment</span> {
    <span class="keyword">private</span> <span class="type">String</span> email;
    <span class="keyword">private</span> <span class="type">String</span> password;

    <span class="keyword">public</span> <span class="type">DigitalWalletPayment</span>(<span class="type">String</span> transactionId, <span class="keyword">double</span> amount, <span class="type">String</span> date, 
                                <span class="type">String</span> customerName, <span class="type">String</span> email, <span class="type">String</span> password) {
        <span class="keyword">super</span>(transactionId, amount, date, customerName, maskEmail(email));
        <span class="keyword">this</span>.email = email;
        <span class="keyword">this</span>.password = password;
    }

    <span class="annotation">@Override</span>
    <span class="keyword">public boolean</span> <span class="method">processPayment</span>() {
        <span class="type">System</span>.out.println(<span class="string">"[Java] DigitalWalletPayment.processPayment() called."</span>);
        <span class="type">System</span>.out.println(<span class="string">"-> Wallet: "</span> + email);
        
        setStatus(<span class="string">"SUCCESS"</span>);
        <span class="keyword">return true</span>;
    }

    <span class="annotation">@Override</span>
    <span class="keyword">public boolean</span> <span class="method">refund</span>() {
        <span class="type">System</span>.out.println(<span class="string">"[Java] DigitalWalletPayment.refund() initiated."</span>);
        <span class="type">System</span>.out.println(<span class="string">"-> Transferring INR "</span> + getAmount() + <span class="string">" back to Wallet: "</span> + getMaskedDetails());
        
        setRefundStatus(<span class="string">"REFUNDED"</span>);
        <span class="keyword">return true</span>;
    }

    <span class="keyword">private static</span> <span class="type">String</span> <span class="method">maskEmail</span>(<span class="type">String</span> email) {
        <span class="keyword">return</span> email.substring(<span class="number">0</span>, <span class="number">2</span>) + <span class="string">"****@"</span> + email.split(<span class="string">"@"</span>)[<span class="number">1</span>];
    }
}`,

    "AccountTransferPayment.java": `
<span class="keyword">package</span> java_backend;

<span class="comment">/**
 * Concrete subclass representing Account Transfer Payment.
 * Demonstrates:
 * 1. Inheritance: Extends the Payment abstract base class.
 * 2. Encapsulation: Protects bank details.
 * 3. Polymorphism: Overrides processPayment() and refund() methods.
 */</span>
<span class="keyword">public class</span> <span class="type">AccountTransferPayment</span> <span class="keyword">extends</span> <span class="type">Payment</span> {
    <span class="keyword">private</span> <span class="type">String</span> bankName;
    <span class="keyword">private</span> <span class="type">String</span> accountNumber;
    <span class="keyword">private</span> <span class="type">String</span> ifscCode;

    <span class="keyword">public</span> <span class="type">AccountTransferPayment</span>(<span class="type">String</span> transactionId, <span class="keyword">double</span> amount, <span class="type">String</span> date,
                                  <span class="type">String</span> customerName, <span class="type">String</span> bankName, <span class="type">String</span> accountNumber, <span class="type">String</span> ifscCode) {
        <span class="keyword">super</span>(transactionId, amount, date, customerName, maskAccountNumber(accountNumber));
        <span class="keyword">this</span>.bankName = bankName;
        <span class="keyword">this</span>.accountNumber = accountNumber;
        <span class="keyword">this</span>.ifscCode = ifscCode;
    }

    <span class="annotation">@Override</span>
    <span class="keyword">public boolean</span> <span class="method">processPayment</span>() {
        <span class="type">System</span>.out.println(<span class="string">"[Java] AccountTransferPayment.processPayment() called."</span>);
        <span class="type">System</span>.out.println(<span class="string">"-> Bank Name: "</span> + bankName + <span class="string">", IFSC: "</span> + ifscCode);
        
        setStatus(<span class="string">"SUCCESS"</span>);
        <span class="keyword">return true</span>;
    }

    <span class="annotation">@Override</span>
    <span class="keyword">public boolean</span> <span class="method">refund</span>() {
        <span class="type">System</span>.out.println(<span class="string">"[Java] AccountTransferPayment.refund() initiated."</span>);
        <span class="type">System</span>.out.println(<span class="string">"-> Reversing Transfer of INR "</span> + getAmount() + <span class="string">" to Account: "</span> + getMaskedDetails());
        
        setRefundStatus(<span class="string">"REFUNDED"</span>);
        <span class="keyword">return true</span>;
    }

    <span class="keyword">private static</span> <span class="type">String</span> <span class="method">maskAccountNumber</span>(<span class="type">String</span> account) {
        <span class="keyword">return</span> <span class="string">"XXXXXX"</span> + account.substring(account.length() - <span class="number">4</span>);
    }
}`,

    "PaymentValidator.java": `
<span class="keyword">package</span> java_backend;

<span class="comment">/**
 * Helper class validating payment configurations.
 * Validates fields BEFORE object actions are completed.
 */</span>
<span class="keyword">public class</span> <span class="type">PaymentValidator</span> {

    <span class="keyword">public static boolean</span> <span class="method">validateCreditCard</span>(<span class="type">String</span> name, <span class="type">String</span> number, <span class="type">String</span> exp, <span class="type">String</span> cvv, <span class="keyword">double</span> amount) {
        <span class="keyword">if</span> (name == <span class="keyword">null</span> || name.trim().isEmpty()) <span class="keyword">return false</span>;
        <span class="keyword">if</span> (number == <span class="keyword">null</span> || number.replaceAll(<span class="string">"\\s"</span>, <span class="string">""</span>).length() != <span class="number">16</span>) <span class="keyword">return false</span>;
        <span class="keyword">if</span> (!exp.matches(<span class="string">"(0[1-9]|1[0-2])/[0-9]{2}"</span>)) <span class="keyword">return false</span>;
        <span class="keyword">if</span> (cvv.length() != <span class="number">3</span>) <span class="keyword">return false</span>;
        <span class="keyword">if</span> (amount &lt;= <span class="number">0</span>) <span class="keyword">return false</span>;
        <span class="keyword">return true</span>;
    }

    <span class="keyword">public static boolean</span> <span class="method">validatePayPal</span>(<span class="type">String</span> email, <span class="type">String</span> password, <span class="keyword">double</span> amount) {
        <span class="keyword">if</span> (email == <span class="keyword">null</span> || !email.contains(<span class="string">"@"</span>)) <span class="keyword">return false</span>;
        <span class="keyword">if</span> (password == <span class="keyword">null</span> || password.length() &lt; <span class="number">6</span>) <span class="keyword">return false</span>;
        <span class="keyword">if</span> (amount &lt;= <span class="number">0</span>) <span class="keyword">return false</span>;
        <span class="keyword">return true</span>;
    }

    <span class="keyword">public static boolean</span> <span class="method">validateBankTransfer</span>(<span class="type">String</span> bankName, <span class="type">String</span> accNum, <span class="type">String</span> ifsc, <span class="keyword">double</span> amount) {
        <span class="keyword">if</span> (bankName == <span class="keyword">null</span> || bankName.isEmpty()) <span class="keyword">return false</span>;
        <span class="keyword">if</span> (accNum.length() &lt; <span class="number">9</span> || accNum.length() &gt; <span class="number">18</span>) <span class="keyword">return false</span>;
        <span class="keyword">if</span> (ifsc.length() != <span class="number">11</span>) <span class="keyword">return false</span>;
        <span class="keyword">if</span> (amount &lt;= <span class="number">0</span>) <span class="keyword">return false</span>;
        <span class="keyword">return true</span>;
    }
}`,

    "PaymentGateway.java": `
<span class="keyword">package</span> java_backend;

<span class="keyword">import</span> java.util.<span class="type">ArrayList</span>;
<span class="keyword">import</span> java.util.<span class="type">List</span>;

/**
 * Handles operations polymorphically.
 * Demonstrates:
 * Dynamic Polymorphism: Receives base type references (Payment)
 * and executes overridden processPayment() and refund() methods at runtime.
 */
<span class="keyword">public class</span> <span class="type">PaymentGateway</span> {
    <span class="keyword">private</span> <span class="type">List</span>&lt;<span class="type">Payment</span>&gt; transactions = <span class="keyword">new</span> <span class="type">ArrayList</span>&lt;&gt;();
    <span class="keyword">private</span> <span class="type">List</span>&lt;<span class="type">RefundRequest</span>&gt; refundRequests = <span class="keyword">new</span> <span class="type">ArrayList</span>&lt;&gt;();

    <span class="keyword">public boolean</span> <span class="method">executePayment</span>(<span class="type">Payment</span> payment) {
        System.out.println("[Gateway] Processing payment...");
        
        // POLYMORPHIC CALL: dynamically resolves subclass method at runtime
        <span class="keyword">boolean</span> success = payment.<span class="method">processPayment</span>();
        <span class="keyword">if</span> (success) {
            transactions.add(payment);
        }
        <span class="keyword">return</span> success;
    }

    <span class="keyword">public void</span> <span class="method">submitRefundRequest</span>(<span class="type">RefundRequest</span> request) {
        refundRequests.add(request);
        
        <span class="keyword">for</span> (<span class="type">Payment</span> p : transactions) {
            <span class="keyword">if</span> (p.getTransactionId().equals(request.getTransactionId())) {
                p.setRefundStatus(<span class="string">"PENDING"</span>);
                <span class="keyword">return</span>;
            }
        }
    }

    <span class="keyword">public boolean</span> <span class="method">processRefundApproval</span>(<span class="type">String</span> refundId, <span class="keyword">boolean</span> approve) {
        <span class="keyword">for</span> (<span class="type">RefundRequest</span> req : refundRequests) {
            <span class="keyword">if</span> (req.getRefundId().equals(refundId)) {
                <span class="keyword">if</span> (approve) {
                    req.setStatus(<span class="string">"APPROVED"</span>);
                    <span class="keyword">for</span> (<span class="type">Payment</span> p : transactions) {
                        <span class="keyword">if</span> (p.getTransactionId().equals(req.getTransactionId())) {
                            
                            // POLYMORPHIC CALL: dynamically resolves subclass refund logic
                            <span class="keyword">boolean</span> success = p.<span class="method">refund</span>();
                            <span class="keyword">if</span> (success) {
                                req.setStatus(<span class="string">"REFUNDED"</span>);
                                p.setRefundStatus(<span class="string">"REFUNDED"</span>);
                            }
                            <span class="keyword">return</span> success;
                        }
                    }
                } <span class="keyword">else</span> {
                    req.setStatus(<span class="string">"REJECTED"</span>);
                    <span class="keyword">return true</span>;
                }
            }
        }
        <span class="keyword">return false</span>;
    }
}`
    ,

    "RefundRequest.java": `
<span class="keyword">package</span> java_backend;

<span class="comment">/**
 * RefundRequest Class.
 * Encapsulates the attributes and status of a refund transaction.
 * Demonstrates:
 * Encapsulation: Variables are private with public getters and setters.
 */</span>
<span class="keyword">public class</span> <span class="type">RefundRequest</span> {
    <span class="keyword">private</span> <span class="type">String</span> refundId;
    <span class="keyword">private</span> <span class="type">String</span> transactionId;
    <span class="keyword">private</span> <span class="keyword">double</span> amount;
    <span class="keyword">private</span> <span class="type">String</span> reason;
    <span class="keyword">private</span> <span class="type">String</span> remarks;
    <span class="keyword">private</span> <span class="type">String</span> status; // PENDING, APPROVED, REJECTED, REFUNDED

    <span class="keyword">public</span> <span class="type">RefundRequest</span>(<span class="type">String</span> refundId, <span class="type">String</span> transactionId, <span class="keyword">double</span> amount, <span class="type">String</span> reason, <span class="type">String</span> remarks) {
        <span class="keyword">this</span>.refundId = refundId;
        <span class="keyword">this</span>.transactionId = transactionId;
        <span class="keyword">this</span>.amount = amount;
        <span class="keyword">this</span>.reason = reason;
        <span class="keyword">this</span>.remarks = remarks;
        <span class="keyword">this</span>.status = <span class="string">"PENDING"</span>;
    }

    <span class="comment">// Getters and Setters</span>
    <span class="keyword">public</span> <span class="type">String</span> <span class="method">getRefundId</span>() { <span class="keyword">return</span> refundId; }
    <span class="keyword">public void</span> <span class="method">setRefundId</span>(<span class="type">String</span> refundId) { <span class="keyword">this</span>.refundId = refundId; }

    <span class="keyword">public</span> <span class="type">String</span> <span class="method">getTransactionId</span>() { <span class="keyword">return</span> transactionId; }
    <span class="keyword">public void</span> <span class="method">setTransactionId</span>(<span class="type">String</span> transactionId) { <span class="keyword">this</span>.transactionId = transactionId; }

    <span class="keyword">public double</span> <span class="method">getAmount</span>() { <span class="keyword">return</span> amount; }
    <span class="keyword">public void</span> <span class="method">setAmount</span>(<span class="keyword">double</span> amount) { <span class="keyword">this</span>.amount = amount; }

    <span class="keyword">public</span> <span class="type">String</span> <span class="method">getReason</span>() { <span class="keyword">return</span> reason; }
    <span class="keyword">public void</span> <span class="method">setReason</span>(<span class="type">String</span> reason) { <span class="keyword">this</span>.reason = reason; }

    <span class="keyword">public</span> <span class="type">String</span> <span class="method">getRemarks</span>() { <span class="keyword">return</span> remarks; }
    <span class="keyword">public void</span> <span class="method">setRemarks</span>(<span class="type">String</span> remarks) { <span class="keyword">this</span>.remarks = remarks; }

    <span class="keyword">public</span> <span class="type">String</span> <span class="method">getStatus</span>() { <span class="keyword">return</span> status; }
    <span class="keyword">public void</span> <span class="method">setStatus</span>(<span class="type">String</span> status) { <span class="keyword">this</span>.status = status; }
}`
};
