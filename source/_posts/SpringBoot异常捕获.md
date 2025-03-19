---
title: SpringBoot异常捕获
excerpt: 记录一下在学习 MallChat 项目过程中学习到的几种异常捕获
date: 2024-10-15 18:37:19
tags: [Java]
category: [学习, Java]
---
{% note %}
记录一下在学习 [MallChat](https://github.com/zongzibinbin/MallChat) 项目过程中学习到的几种异常捕获
{% endnote %}
# 线程池
众所周知，默认情况下，`ThreadPoolTaskExecutor` 中的线程在执行过程中如果出现未捕获的异常，异常信息不会自动输出到日志中，这会使得排查错误变得困难。为了增强对线程池中未捕获异常的处理，可以通过实现 `Thread.UncaughtExceptionHandler` 来捕获异常，并将异常日志记录下来
## 实现自定义异常处理器
自定义一个 `UncaughtExceptionHandler`，用于捕获并记录线程中的未捕获的异常:
```
@Slf4j
public class MyUncaughtExceptionHandler implements Thread.UncaughtExceptionHandler {
    @Override
    public void uncaughtException(Thread t, Throwable e) {
      log.error("Exception in thread" , e);
    }
}
```
## 创建自定义的 `ThreadFactory`
在自定义的 `ThreadFactory` 中，将该异常处理机制应用到每个线程上：
```
@AllArgsConstructor
public class MyThreadFactory implements ThreadFactory {
    private static final MyUncaughtExceptionHandler MY_UNCAUGHT_EXCEPTION_HANDLER = new MyUncaughtExceptionHandler();
    private ThreadFactory original;
    @Override
    public Thread newThread(Runnable r) {
        Thread thread = original.newThread(r);// 执行spring线程自己的创建逻辑
        // 额外装饰需要的创建逻辑
        thread.setUncaughtExceptionHandler(MY_UNCAUGHT_EXCEPTION_HANDLER);
        return thread;
    }
}
```
## 在线程池中应用自定义的 `ThreadFactory`
将自定义的 `MyThreadFacroty` 设置进线程池配置中: 
```
    @Bean(MALLCHAT_EXECUTOR)
    @Primary
    public ThreadPoolTaskExecutor mallchatExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setCorePoolSize(10);
        executor.setMaxPoolSize(10);
        executor.setQueueCapacity(200);
        executor.setThreadNamePrefix("mallchat-executor-");
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());//满了调用线程执行，认为重要任务
        executor.setThreadFactory(new MyThreadFactory(executor)); // 设置自定义的ThreadFactory
        executor.initialize();
        return executor;
    }
```
## 测试捕获结果
使用以下代码进行测试: 
```
    @Autowired
    private ThreadPoolTaskExecutor threadPoolTaskExecutor;
    @Test
    public void thread1() throws InterruptedException {
        Thread thread = new Thread( ()->{
            if (1 == 1) {
                log.error("1234");
                throw new RuntimeException("1234");
            }
        });
        thread.setUncaughtExceptionHandler(new MyUncaughtExceptionHandler());
        thread.start();
        Thread.sleep(200);
    }
```
可以看到异常在log中的打印
![](https://blog-1318796820.cos.ap-shanghai.myqcloud.com/blog/202410151908995.png)


# 对于项目中参数错误异常的捕获以及返回
`Spring` 框架中提供了对于传参的限制条件的注解，如 `@NotBlank`, `@Length`, `@NotNull` 等注解，非常利于开发。然而，这些注解的报错信息只会在 log 中打印，而不会返回给前端。以下是一个示例：
```
@Data
public class ModifyNameReq {
    @ApiModelProperty("用户名")
    @NotBlank
    @Length(max = 2, message = "用户名过长")
    private String name;
}
```
当我传参为
```
{
    "name" : "江上清风1111111"
}
```
返回的结果: 
```
{
    "timestamp": 1728992170171,
    "status": 400,
    "error": "Bad Request",
    "path": "/capi/user/name"
}
```
而错误信息只是在系统日志中进行打印
```
2024-10-15 19:36:10.159  WARN 40880 --- [nio-8080-exec-1] .w.s.m.s.DefaultHandlerExceptionResolver : Resolved [org.springframework.web.bind.MethodArgumentNotValidException: Validation failed for argument [0] in public com.chat.mallchat.common.common.domain.vo.resp.ApiResult<java.lang.Void> com.chat.mallchat.common.user.controller.UserController.modifyName(com.chat.mallchat.common.user.domain.vo.req.ModifyNameReq) with 2 errors: [Field error in object 'modifyNameReq' on field 'name': rejected value [江上清风1111111]; codes [Length.modifyNameReq.name,Length.name,Length.java.lang.String,Length]; arguments [org.springframework.context.support.DefaultMessageSourceResolvable: codes [modifyNameReq.name,name]; arguments []; default message [name],2,0]; default message [用户名过长]] [Field error in object 'modifyNameReq' on field 'id': rejected value [null]; codes [NotNull.modifyNameReq.id,NotNull.id,NotNull.java.lang.Long,NotNull]; arguments [org.springframework.context.support.DefaultMessageSourceResolvable: codes [modifyNameReq.id,id]; arguments []; default message [id]]; default message [别忘记传id]] ]
```
因此，我们需要捕获抛出的异常中的错误信息，并利用自定义的 ApiResult 前后端交互协议进行返回。

## 捕获异常
在 `log` 中可以看到抛出异常的类
![](https://blog-1318796820.cos.ap-shanghai.myqcloud.com/blog/202410151946927.png)
新建一个异常捕获的处理类, 其中
- `@RestControllerAdvice` 用于标记 `GlobalExceptionHandler` 类为全局异常处理类，专门处理 REST 控制器中的异常，并以 JSON 格式返回响应;
- `@ExceptionHandler` 注解用于指定捕获特定类型的异常
```
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {
    /**
     * 前端传参数据据格式错误的异常捕获
     */
    @ExceptionHandler(value = MethodArgumentNotValidException.class)
    public ApiResult<?> methodArgumentNotValidException(MethodArgumentNotValidException e) {
        System.out.println();
        return ApiResult.fail(null, null);
    }

}
```
## 查看异常数据
进行断点查看抛出异常时的数据:
![报错断点](https://blog-1318796820.cos.ap-shanghai.myqcloud.com/blog/202410151956645.png)
可以看到, 异常的信息在 `bindingResult` 下的 `errors` 中, 其中 `field` 时发生错误的字段, `defaultMessage` 是在 `vo类` 中设置的错误信息. 
在 `Handler类` 中对这些信息进行处理。其中, 不同属性的报错以逗号隔开:
```
    @ExceptionHandler(value = MethodArgumentNotValidException.class)
    public ApiResult<?> methodArgumentNotValidException(MethodArgumentNotValidException e) {
        StringBuilder errorMsg = new StringBuilder();
        e.getBindingResult().getFieldErrors().forEach(x -> errorMsg.append(x.getField()).append(x.getDefaultMessage()).append(","));
        String message = errorMsg.toString();
        return ApiResult.fail(CommonErrorEnum.PARAM_INVALID.getCode(), message.substring(0, message.length() - 1));
    }
```
## 接口返回结果
```
{
    "success": false,
    "errCode": -2,
    "errMsg": "name用户名过长",
    "data": null
}
```
可以看到在 `errMsg` 中有处理过的信息了

# 对系统内部异常的拦截
## 捕获异常并处理
当系统发生错误时，如果直接将详细的错误信息返回给前端（堆栈跟踪、异常类型等），可能会暴露内部实现细节或敏感数据，给潜在的攻击者提供利用漏洞的机会。因此，通过全局异常拦截，只返回固定的错误信息，如 "系统出错，请稍后再试"，可以有效地避免暴露内部信息，提升系统的安全性。
与上面对于 `参数异常捕获` 的方式一样, 不同的是只需要设置一个固定的返回信息就行。
对于 `Throwable.class` 的处理类
```
    /**
     * 拦截系统内部错误信息,防止暴露给前端
     * @param e
     */
    @ExceptionHandler(value = Throwable.class)
    public ApiResult<?> throwable(Throwable e) {
        log.error("system exception! the reason is: {}", e.getMessage(), e);
        return ApiResult.fail(CommonErrorEnum.SYSTEM_ERROR);
    }
```
## 编写测试接口
```
    @GetMapping("/test")
    public ApiResult<UserInfoResp> getUserInfo() {
        if (1 == 1) {
            int i = 1/0;
        }
        return ApiResult.success()
    }
```
## 测试捕获以及接口返回结果

接口测试:
```
{
    "success": false,
    "errCode": -1,
    "errMsg": "系统出小差了, 请稍后再试哦~~",
    "data": null
}
```
系统日志:
![](https://blog-1318796820.cos.ap-shanghai.myqcloud.com/blog/202410152035451.png)