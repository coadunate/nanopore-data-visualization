// The configuration for the graph.
var
    marginFocus = {top: 30, right: 50, bottom: 90, left: 50},
    marginContext = {top: 530, right: 20, bottom: 40, left: 40},

    width = (window.innerWidth) - marginFocus.left - marginFocus.right-20, // width = 900
    height = 602 - marginFocus.top - marginFocus.bottom, // height = 370

    height2 = 602 - marginContext.top - marginContext.bottom; // height2 = 40

// The svg contians everthing inside the graph.
var svg = d3.select(".app").append("svg")
    .attr("width", width + marginFocus.left + marginFocus.right)
    .attr("height", height + marginFocus.top + marginFocus.bottom + 100 + 500);


// Creating scales for the graph.
var x = d3.scaleLinear().range([0 , width]),
    x2 = d3.scaleLinear().range([0, width]),
    y = d3.scaleLinear().range([height, 0]),
    y2 = d3.scaleLinear().range([height2, 0]);



var lineFunction = d3.line()
    .x(function(d) { return x(d.index); })
    .y(function(d) { return y(d.signal); });

var lineFunction2 = d3.line()
    .x(function(d) { return x2(d.index); })
    .y(function(d) { return y2(d.signal); });



// This represents the strip below showing the mini version of the graph.
var context = svg.append("g")
    .attr("class", "context")
    .attr("transform", "translate(" + marginContext.left + "," + marginContext.top + ")");

d3.json("/data/combined.json", function(error, data) {

    if (error) throw error;

    data[1][0].forEach(function(d){
      d.index = +d.index;
      d.signal = +d.signal;
      d.model = d.model;
      d.time = +d.time;
      d.length = +d.length;
      d.stdv = +d.stdv;
    });

    data[0][0].forEach(function(d){
      d.index = +d.index;
      d.signal = +d.signal;
      d.model = d.model;
      d.time = +d.time;
      d.length = +d.length;
      d.stdv = +d.stdv;
    });
    x.domain([0,data[2].ref_length]);
    y.domain([
                Math.min( d3.min(data[1][0], function(d){ return d.signal; }),d3.min(data[0][0], function(d){ return d.signal; } )),
                Math.max( d3.max(data[1][0], function(d){ return d.signal; }),d3.max(data[0][0], function(d){ return d.signal; } ))
                //d3.min(data[0][0], function(d){ return d.signal; } ),
                //d3.max(data[0][0], function(d){ return d.signal; })
              ]);
    x2.domain(x.domain());
    y2.domain(y.domain());


    var brush = d3.brushX()
        .extent([[0, 0], [width, height2]])
        .on("brush end", brushed);

    var zoom = d3.zoom()
        .scaleExtent([1, Math.max(data[1][0].length,data[0][0].length) ])
        .translateExtent([[0, 0], [width, height]])
        .extent([[0, 0], [width, height]])
        .on("zoom", zoomed);


    var xAxis = d3.axisBottom(x).tickSize(-height),
        xAxis2 = d3.axisBottom(x2),
        yAxis = d3.axisLeft(y).ticks(5).tickSize(-width);

    var reads = svg.append("g")
        .attr("class","reads")
        .attr("transform","translate(" + marginFocus.left + "," + (marginFocus.top + height + height2 + 100) + ")")
        .call(zoom);

    var read_container = reads.append("g").attr("class","container");

    read_container.append("g")
         .attr("class","axis axis--x")
         .attr("transform","translate(0," + height  +  ")")
         .call(xAxis);


    reads.append("text")
       .style("text-anchor","middle")
       .style("font-size","15px")
       .attr("transform","rotate(-90) translate(" + -height/2 + ",-30)")
       .text("# Reads");

    for(var i = 0; i < data.length-1; i++){
      console.log("I: " + i);
      reads.append("svg").attr("width",width).attr("height",height).selectAll("rect")
           .data(data[i][0])
           .enter()
           .append("rect")
           .attr("x", function(d){ return x(d.index ); })
           .attr("y", y(140 - (10*i) ) )
           .attr("width", function(d){ return x(d.index + 100)})
           .attr("height",50)
           .attr("class","read-rect")
           .attr("fill", i==0 ? "blue" : "red" );
    }


    svg.selectAll(".read-rect").filter(":nth-last-child(1)").attr("fill","grey");

    // This is the main graph.
    var focus = svg.append("g")
        .attr("class", "focus")
        .attr("transform", "translate(" + marginFocus.left + "," + marginFocus.top + ")")
        .call(zoom);

    // comment this line to get the popup appear.
    var rect = svg.append("rect")
        .attr("width",width)
        .attr("transform","translate(50,0)")
        .attr("height",height)
        .style("fill", "none")
        .style("pointer-events", "all").call(zoom);

    var container = focus.append("g").attr("class","container");

    container.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    container.append("g")
        .attr("class", "axis axis--y")
        .call(yAxis);

    focus.append("text")
        .style("text-anchor","middle")
        .style("font-size","15px")
        .attr("transform","rotate(-90) translate(" + -height/2 + ",-30)")
        .text("Signal Value (pA)");

    var div = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    for(var i = 0; i < data.length-1; i++){
      focus.append("svg").attr("width",width).attr("height",height).selectAll("circle")
          .data(data[i][0])
          .enter()
          .append("circle")
          .on("click",function(d){ console.log("Yo!"); })
          .attr("cx", function(d){ return x(d.index);})
          .attr("cy", function(d){ return y(d.signal);})
          .attr("class","dot")
          .attr("r",5)
          .on("mouseover", function(d){
              div.transition()
                  .duration(200)
                  .style("opacity", 0.9)
                  .style("text-align","left");
              //index,signal,time,model,length,stdv
              div.html(
                  "<b>Event #:</b> " + (d.index) + "<br />" +
                  "<b>Signal:</b> " + d.signal + "<br />" +
                  "<b>Time:</b> " + d.time + "<br />" +
                  "<b>Model:</b> " + d.model + "<br />" +
                  "<b>Length:</b> " + d.length + "<br />" +
                  "<b>Std. Dev:</b>" + d.stdv + "<br/>"
              )
                  .style("left", (d3.event.pageX) + "px")
                  .style("top", (d3.event.pageY - 8) + "px");
          })
          .on("mouseout", function(d) {
              div.transition()
                  .duration(500)
                  .style("opacity", 0);
          });

      focus.append("svg").attr("width",width).attr("height",height).append("path")
          .datum(data[i][0])
          .attr("class", "squiggle")
          .attr("d", lineFunction)
          .attr("stroke", i==0 ? "blue" : "red")
          .attr("stroke-width",2)
          .attr("fill","none");

      context.append("path")
          .datum(data[i][0])
          .attr("class", "squiggle")
          .attr("d", lineFunction2)
          .attr("stroke",i==0 ? "blue" : "red")
          .attr("stroke-width",2)
          .attr("fill","none");
    }


    context.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + height2 + ")")
        .call(xAxis2);

    context.append("g")
        .attr("class", "brush")
        .call(brush)
        .call(brush.move, x.range());


    function brushed() {

        if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
        var s = d3.event.selection || x2.range();
        x.domain(s.map(x2.invert, x2));
        focus.selectAll(".squiggle").attr("d", lineFunction);
        focus.select(".axis--x").call(xAxis);
        reads.select(".axis--x").call(xAxis);
        svg.select(".zoom").call(zoom.transform, d3.zoomIdentity
            .scale(width / (s[1] - s[0]))
            .translate(-s[0], 0));


        focus.selectAll("circle")
            .attr("cx", function(d){ return x(d.index); })
            .attr("cy", function(d){ return y(d.signal); });

    }

    function zoomed() {
        if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return; // ignore zoom-by-brush
        var t = d3.event.transform;
        x.domain(t.rescaleX(x2).domain());
        focus.selectAll(".squiggle").attr("d", lineFunction);
        focus.select(".axis--x").call(xAxis);
        reads.select(".axis--x").call(xAxis);
        context.select(".brush").call(brush.move, x.range().map(t.invertX, t));

        svg.selectAll(".dot")
            .attr("cx", function(d){ return x(d.index); })
            .attr("cy", function(d){ return y(d.signal); });

        svg.selectAll(".read-rect")
            .attr("x", function(d){ return x(d.index); })
            .attr("width",function(d){ return x(d.index + 100) > 0 ? x(d.index + 100) : 0; });

    }

});

// function type(d) {
//     d.index = d.index;
//     d.signal = +d.signal;
//     d.time = +d.time;
//     d.length = +d.length;
//     d.stdv = +d.stdv;
//     return d;
// }
