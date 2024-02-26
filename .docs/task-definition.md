# Drone delivery transportation and innovations

Nowadays, transportation and deliveries are receiving a big push from the AI world. A lot of technologies, devices are introduced and some are already operational:

- Drones for deliveries
- Drones used for taxis
- Self-driving cars
- Driverless busses and taxis
- Traffic prediction
- Smart traffic lights and bus stations
- Etc.

## Part 1

We live in a very innovative region, a metropolitan area that currently wants to research the possibilities for creation of a drone delivery network, helping its citizens. While that may sound admirable, there are lots of unknowns in front of our municipality to start project planning. Fortunately, the mayor is an urban and metropolitan studies graduate, therefore it can be easily seen that this is a tough optimization problem. It hides different challenges that require a diverse skillset to solve them accordingly:

1. How many warehousing facilities would be enough to serve potential customer orders,
2. How to strategically choose a warehousing facilities location,
3. How to find some delivery time estimate, depending on the warehousing facilities distribution in the area,
4. How to plan the optimal delivery routes in the metropolitan area with lots of horizontal and vertical construction - how to take off and land a drone in this area,
5. How to plan the delivery time needed, avoiding all obstacles - is there a way to precompute all the possible routes apriori to instruct the drones easily or a complex type of drones will be required to be able to navigate optimally in the metropolitan area.

Even though we are not experts in math, statistics and machine learning, nor do we have solid experience in urban planning, we know that we have to split the problem to smaller ones. Having that argument, a different dimensions of the problem can be simplified, substituted, approximated first.

Let's focus over the drone movement since it is not always easy to avoid obstacles, plan the entire path and time needed. A very good place to start is to ignore all the path obstacles in the 3D world. One step further into this direction dictates that the region map can be substituted with its 2D representation. A location representation becomes a 2D point (a point having two coordinates). The starting problem is to invent a way to know the exact path a drone will go through all the obstacles (and time needed) delivering a package from a warehouse to a building entrance for a customer. For the purposes of our municipality doing an initial research and project planning, а reasonable simplification of the problem is to find a straight path without all obstacles.

To put it differently, a drone moves only in straight lines between a current position and a target (a customer or warehouse location) and then picks another target. Another thing can be concluded from that thinking about the metropolitan area - it can be substituted with a rectangular representation and all drone movements can happen in that area. A customer as well as a warehouse location becomes a point the 2D representation of the metropolitan area.

Now let's continue delving into about another aspect - the time. Even if we "ignored" the obstacles to make the problem 2D, the movement still takes time. A few examples where the drones can wait are:

- At the customer location, till the order is picked up,
- Potentially waiting in the warehouse to take the next customer delivery,
- To be re-charged,
- To not have a constant movement due to normal movement conditions or time needed to recompute a route or other thing that make the drone wait instead of moving at a constant speed,
- Different drones might have complex motion algorithms requiring intermediary stops due to weather conditions, battery charge or other reasons.

For helping the municipality with the initial research, a rough estimate of delivery time is enough. Therefore the movement speed can be considered constant and equal to a single unit in the map for a minute (for example, the drone travels the distance from point (0,0) to the point (0, 1) for one minute). A significant research have to be made about the types of drones, their prices and other characteristics like the battery capacity and consumption. Again, for the rough estimate of time, it is OK to assume that drone batteries are enough to do deliveries during the day and are recharged during the night, inside warehouses (that also means that our drone delivery network will deliver orders only during the day).

As for the time needed to stay at warehouse to pick the next order we can assume that this is about 5 minutes and this is the time just for picking the order, which will be prepared in a package beforehand. The order, when delivered could be just left in front of the customer's door and a separate notification is sent, meaning there is no waiting time for the drone, to wait the the customer to pick up the order.

For now, a good approximation we need to consider is that all the warehouses are having unlimited quantities from all the products.

Last but not least, at any given time, a drone can carry only a single delivery of all the products inside it.

Even with all the assumptions the mayor needs our help developing a program that can help planning the establishment of a drone delivery network, the needed resources investment and potentially the stages needed in this project to start and complete it.


### a) Basic Drones - Time

Our first task is to deliver an application to the mayor that, given the warehouses and customer locations as well as a list of different customer orders, returns:

- The total time, in minutes, needed to deliver all orders (the minute that is considered as last is the one in which the last order is delivered and dropped at a customer location), not taking into account the time in which all the drones go back at a random warehouse to recharge during the night.

Having this application, the municipality representatives can play with it, enter different input, different places to position precisely the warehouses, different numbers of orders, products, in order to get an understanding of what can be achieved and plan carefully how to proceed with this project.

### b) Basic Drones - Drones Used

Together with the total time, the number of drones that are used to do those deliveries is needed as well in order to estimate the resources needed to establish that delivery network.

### c) Drone Charging - Consume Only When Move

The current application is useful for the municipality to start the work on the project to have drone deliveries in the cities around. However, having the initial very rough estimates led the municipality representatives start communication with companies that sell drones in order to get to know more about prices and how they are used, maintained, etc. From it, they understood details about drones that have to be taken into consideration in the application we have built. The drones that have enough capacity to last a full day are very expensive. Fortunately, there are more affordable alternatives that are offered to the municipality. The ones that deserve attention, having in mind their prices and maintenance, are having big enough batteries to last a few deliveries but they have to be recharged. Their power/battery consumption is based on the distance they cover. If it happens that their battery is drained when moving on the map, the drone is taken back to the warehouses at night. We have to develop an extension of the application (it still needs to return the things from the previous experiments) in which we can configure:

- The battery capacity of each drone, in kW,
- The drone power consumption, in W per minute.

It is safe to assume a few things on top of the previous:

- The drones are still recharged at night. During the day, those drones we consider using, can be recharged at the warehouses (we will install chargers inside them) and each full charge takes 20 minutes (proportionally for not a full charges),
- The capacities and consumption can be found in the input file.

If there are drones out of capacity on the map, they have to stay there till the end of the day. Since we rely on the quality of the products we can consider the load of such drones as lost.


Using the program for doing rough estimations of the project, new ideas popped up that will be even make it more useful. A more realistic scenario is to be able to see the entire flow of the program, all the movements of all the drones in order those orders to be delivered (can be simple console output).


## Part 2

### d) Program Output Real-Time

The program, while retaining its original objectives, should now be enhanced to simulate X program minutes over Y real-life milliseconds. This temporal mapping should be configurable through the input parameters, alongside other variables such as warehouse locations, customer locations, and orders. Additionally, the program should offer flexibility in its operation, allowing users to choose between running with real-time output (displaying all drone movements and order fulfilments) or without (directly presenting the final outcome without showing intermediate steps).

### e) Add New Order

To further increase the program's realism, especially when running with real-time output, it should be possible for customers to input new orders during its execution. The simplest method for order entry would be through the same configuration file, which could be checked every program minute to enhance user friendliness.

### f) Basic Drones - Average Time

After extensive experimentation with the current program and an initial resource estimation, the municipality is ready to move onto a more detailed phase of the drone delivery network project. This next step involves a closer examination of delivery precision, optimal delivery times, drone types best suited for efficiency, their technological advancements, pricing, etc. A useful metric for project planning introduced at this stage is the average time taken to deliver an order. Consequently, the program, in addition to reporting the number of drones used and the total time required for all deliveries, should now also calculate and output the average delivery time per order.

## Part 3

A viable next phase of the project involves planning activities that include manual testing by different users, who should be able to interact with the program simultaneously to add orders and gather more insights about the drone delivery network. Ideally, a new program would be developed to work in conjunction with the existing one, facilitating user requests and generating outputs accordingly. Specifically, if the initial program is set to run with real-time output, then a secondary program should be capable of connecting to it for sending commands and receiving results, thereby enabling multiple users to conduct separate tests and create real-life scenarios.

### g) Add New Order

In the secondary program, there should be a mechanism to input new orders (singular or multiple) via a configuration file, maintaining the format used by the first program. This setup should be designed to check the configuration file every program minute for new user commands. The aim is to have the primary program run in real-time mode while allowing several users to operate distinct instances of the secondary program to add new orders as desired.

### h) All Orders Status

The secondary program should also feature the capability to display the status of all orders (awaiting delivery, already delivered, or currently being delivered). Utilizing the configuration file for command input, an on/off toggle should be implemented to enable or disable the output of all order statuses. For ease of use, an additional configuration option should be introduced to specify how frequently status updates are provided. This frequency should be defined in program minutes, dictating the intervals at which status updates are issued (if the toggle is activated). In summary, various users will initiate the secondary program to add orders and configure it to periodically provide status updates within a specified time frame.

### i) Drone Charging - Consume for Each Kilogram Taken

A new drone model is presented to the municipality, characterized by power/battery consumption that depends not only on the distance traveled but also on the payload carried. This feature necessitates adjustments to the program (which will still incorporate functionalities from previous iterations) to include configurations for:

- The weight of each product, in grams.
- The drone power consumption, in watts per kilogram per minute.

Additional assumptions to facilitate program use include:

- The carrying capacity of a drone is limited solely by its power consumption.
- The precise power consumption per minute should be calculated by rounding the current load to the nearest kilogram.
