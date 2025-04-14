---
title: Hibernate中的多对一、一对多映射  
key: 1591888868date: 2020-06-11 23:21:08  
updated: 2023-02-13 18:28:44
tags: 
 - Java  
---


# 前言

之前写的一对一
这次写写多对一、一对多  

<!-- more -->

# 准备

一个Hibernate环境的Java项目
这个之前的帖子有
就不再写了  

# 一对多（多对一）

这里用老师和学生来做例子
一个老师有多个学生
一个学生只能属于一个老师

Teacher类

```java
public class Teacher {
    private int id;
    private String name;
    // 注意：这里的set要自己初始化，不然会报空指针的异常
    private Set<Student> list = new HashSet<>();
    // ...省略getter、setter和toString方法
}
```

Teacher类对应的Teacher.hbm.xml

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE hibernate-mapping PUBLIC
        "-//Hibernate/Hibernate Mapping DTD 3.0//EN"
        "http://www.hibernate.org/dtd/hibernate-mapping-3.0.dtd">
<hibernate-mapping>
    <class name="pojo.Teacher">
        <id name="id">
            <generator class="native"></generator>
        </id>
        <property name="name"></property>
        <!-- set表示一个无需不重复的集合 -->
        <!-- name表示类中集合的属性名 -->
        <set name="list">
            <!-- 
                key表示多的一方的外键，column指定列名
                也就是会在student表指定一个列，列名为teacher_id来指向老师
             -->
            <key column="teacher_id"></key>
            <!-- 指定集合的类型 -->
            <one-to-many class="pojo.Student"></one-to-many>
        </set>
    </class>
</hibernate-mapping>

```

Student类

```java
public class Student {
    private int id;
    private String name;
    private Teacher teacher;
    // ...省略getter、setter和toString方法
}
```

Student类对应的Student.hbm.xml

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE hibernate-mapping PUBLIC
        "-//Hibernate/Hibernate Mapping DTD 3.0//EN"
        "http://www.hibernate.org/dtd/hibernate-mapping-3.0.dtd">
<hibernate-mapping>
    <class name="pojo.Student">
        <id name="id">
            <generator class="native"></generator>
        </id>
        <property name="name"></property>
        <!-- 学生这一方是多的一方，指向老师一的一方 -->
        <!-- name表示类中对应一的一方的属性名，column表示学生这一方指向老师的外键列名 -->
        <many-to-one name="teacher" column="teacher_id"></many-to-one>
    </class>
</hibernate-mapping>

```

写个测试类测试下

```java
public class HibernateTest {

    @Test
    public void test01() {
        Session session = SessionUtil.getSession();
        Transaction transaction = session.beginTransaction();
        
        // new一个老师
        Teacher teacher = new Teacher();
        teacher.setName("teacher");
        // new两个学生
        Student student1 = new Student();
        student1.setName("student1");
        Student student2 = new Student();
        student2.setName("student2");
        // 老师一方设置关联关系
        teacher.getList().add(student1);
        teacher.getList().add(student2);
        // 学生一方设置关联关系
        student1.setTeacher(teacher);
        student2.setTeacher(teacher);
        // 保存
        session.save(teacher);
        session.save(student1);
        session.save(student2);

        transaction.commit();
        session.close();
        SessionUtil.close();
    }
}

```
运行之后
就可以看到

Teacher表

![](https://i.loli.net/2019/11/07/THICmyLYuxnXwM1.png)

Student表

![](https://i.loli.net/2019/11/07/JghAep67vrxfUBa.png)

Student表中的外键

![](https://i.loli.net/2019/11/07/hptKj8J7sEDmiXb.png)  

# 后记

多对一还好
不是特别的难理解  